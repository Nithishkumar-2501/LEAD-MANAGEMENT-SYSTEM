/**
 * ============================================================================
 * WebRTCVoiceClient - Production-Grade WebRTC Audio Engine
 * ============================================================================
 * Handles:
 * - Signaling protocol synchronization via Socket.io
 * - MediaStream capture with acoustic echo cancellation & noise suppression
 * - RTCPeerConnection lifecycle & Google public STUN negotiation
 * - ICE candidate queue buffering (prevents setRemoteDescription race conditions)
 * - Remote audio stream binding to HTML5 Audio element
 * - Track mute/unmute and clean resource disposal
 */

class WebRTCVoiceClient {
  constructor({ socket, currentUser, onStateChange, onRemoteStream, onError }) {
    this.socket = socket;
    this.currentUser = currentUser; // { userId, role, name }
    this.onStateChange = onStateChange || (() => {});
    this.onRemoteStream = onRemoteStream || (() => {});
    this.onError = onError || ((err) => console.error("[WebRTC Error]", err));

    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.remoteAudioElement = null;
    this.activePartnerUserId = null;
    this.activeCallId = null;

    // Critical WebRTC reliability mechanism:
    // Buffer ICE candidates that arrive before setRemoteDescription completes
    this.iceCandidateQueue = [];
    this.isRemoteDescriptionSet = false;

    // Standard STUN servers for NAT traversal
    this.rtcConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
      ],
      iceCandidatePoolSize: 10,
    };

    this.setupAudioElement();
    this.bindSocketEvents();
  }

  // Hidden audio element to play remote peer audio
  setupAudioElement() {
    this.remoteAudioElement = document.createElement("audio");
    this.remoteAudioElement.autoplay = true;
    this.remoteAudioElement.id = "webrtc-remote-audio";
    this.remoteAudioElement.style.display = "none";
    document.body.appendChild(this.remoteAudioElement);
  }

  bindSocketEvents() {
    // 1. Remote SDP Offer received
    this.socket.on("webrtc-offer", async ({ fromUserId, offer }) => {
      console.log("[WebRTC] Received SDP Offer from:", fromUserId);
      try {
        this.activePartnerUserId = fromUserId;
        await this.handleReceivedOffer(offer, fromUserId);
      } catch (err) {
        this.onError(`Failed to handle WebRTC Offer: ${err.message}`);
      }
    });

    // 2. Remote SDP Answer received
    this.socket.on("webrtc-answer", async ({ fromUserId, answer }) => {
      console.log("[WebRTC] Received SDP Answer from:", fromUserId);
      try {
        await this.handleReceivedAnswer(answer);
      } catch (err) {
        this.onError(`Failed to handle WebRTC Answer: ${err.message}`);
      }
    });

    // 3. Remote ICE Candidate received
    this.socket.on("ice-candidate", async ({ fromUserId, candidate }) => {
      try {
        await this.handleReceivedCandidate(candidate);
      } catch (err) {
        this.onError(`Failed to add ICE candidate: ${err.message}`);
      }
    });

    // 4. Remote peer ended call
    this.socket.on("call-ended", ({ callId, reason }) => {
      console.log("[WebRTC] Call ended by server/peer:", reason);
      this.closeCall(false);
      this.onStateChange("ENDED", { reason });
    });
  }

  // Request browser microphone with high-fidelity voice processing
  async getLocalMicrophoneStream() {
    if (this.localStream) return this.localStream;

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
        },
        video: false,
      });
      return this.localStream;
    } catch (err) {
      console.error("[WebRTC] Microphone permission denied or unavailable:", err);
      throw new Error(`Microphone access denied: Please allow microphone permission in your browser.`);
    }
  }

  // Initialize RTCPeerConnection instance
  createPeerConnection(targetUserId) {
    if (this.peerConnection) {
      this.closePeerConnection();
    }

    this.peerConnection = new RTCPeerConnection(this.rtcConfiguration);
    this.activePartnerUserId = targetUserId;
    this.isRemoteDescriptionSet = false;
    this.iceCandidateQueue = [];

    // Local ICE candidate generated -> send to remote peer via signaling server
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit("ice-candidate", {
          toUserId: this.activePartnerUserId,
          candidate: event.candidate,
        });
      }
    };

    // Remote audio track received -> stream into audio element
    this.peerConnection.ontrack = (event) => {
      console.log("[WebRTC] Received remote audio stream track:", event.streams[0]);
      this.remoteStream = event.streams[0];
      this.remoteAudioElement.srcObject = this.remoteStream;

      // Handle modern browser autoplay constraints
      this.remoteAudioElement.play().catch((err) => {
        console.warn("[WebRTC] Autoplay requires user interaction:", err);
      });

      this.onRemoteStream(this.remoteStream);
    };

    // Connection state logging & state notification
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection ? this.peerConnection.connectionState : "closed";
      console.log(`[WebRTC Connection State]: ${state}`);

      if (state === "connected") {
        this.onStateChange("CONNECTED");
      } else if (state === "disconnected" || state === "failed" || state === "closed") {
        this.onStateChange("DISCONNECTED");
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log(`[WebRTC ICE State]: ${this.peerConnection.iceConnectionState}`);
    };

    // Attach local microphone tracks to PeerConnection
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    return this.peerConnection;
  }

  // Caller: Generates WebRTC SDP Offer and transmits to Callee
  async createAndSendOffer(targetUserId) {
    await this.getLocalMicrophoneStream();
    const pc = this.createPeerConnection(targetUserId);

    console.log("[WebRTC] Creating SDP Offer for:", targetUserId);
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false,
    });

    await pc.setLocalDescription(offer);

    // Relay Offer through signaling server (NOTE: mapped by userId, zero phone numbers!)
    this.socket.emit("webrtc-offer", {
      toUserId: targetUserId,
      offer: pc.localDescription,
    });
  }

  // Callee: Receives SDP Offer, sets remote description, flushes candidate queue, and responds with Answer
  async handleReceivedOffer(offer, fromUserId) {
    await this.getLocalMicrophoneStream();
    const pc = this.createPeerConnection(fromUserId);

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    this.isRemoteDescriptionSet = true;

    // Process any queued candidates that arrived before offer was set
    await this.flushIceCandidateQueue();

    console.log("[WebRTC] Creating SDP Answer for:", fromUserId);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.socket.emit("webrtc-answer", {
      toUserId: fromUserId,
      answer: pc.localDescription,
    });
  }

  // Caller: Receives SDP Answer and completes handshake
  async handleReceivedAnswer(answer) {
    if (!this.peerConnection) return;

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    this.isRemoteDescriptionSet = true;

    // Process queued candidates
    await this.flushIceCandidateQueue();
    console.log("[WebRTC] Remote Answer set successfully! WebRTC Handshake complete.");
  }

  // Candidate handling with safety buffer
  async handleReceivedCandidate(candidate) {
    if (!candidate) return;

    const rtcCandidate = new RTCIceCandidate(candidate);

    if (this.peerConnection && this.isRemoteDescriptionSet) {
      await this.peerConnection.addIceCandidate(rtcCandidate);
    } else {
      // Buffer until setRemoteDescription finishes
      this.iceCandidateQueue.push(rtcCandidate);
    }
  }

  async flushIceCandidateQueue() {
    while (this.iceCandidateQueue.length > 0) {
      const cand = this.iceCandidateQueue.shift();
      try {
        await this.peerConnection.addIceCandidate(cand);
      } catch (err) {
        console.warn("[WebRTC] Error flushing ICE candidate:", err);
      }
    }
  }

  // Microphone Mute / Unmute Toggle
  toggleMute() {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return !audioTrack.enabled; // returns true if MUTED
    }
    return false;
  }

  isMuted() {
    if (!this.localStream) return true;
    const audioTrack = this.localStream.getAudioTracks()[0];
    return audioTrack ? !audioTrack.enabled : true;
  }

  // Terminate call and clean up all resources
  hangup(callId) {
    if (this.activePartnerUserId) {
      this.socket.emit("end-call", {
        toUserId: this.activePartnerUserId,
        callId: callId || this.activeCallId,
      });
    }
    this.closeCall(true);
  }

  closeCall(emitStateChange = true) {
    this.closePeerConnection();
    this.stopLocalStream();

    this.activePartnerUserId = null;
    this.activeCallId = null;

    if (emitStateChange) {
      this.onStateChange("ENDED", { reason: "Local user hung up." });
    }
  }

  closePeerConnection() {
    if (this.peerConnection) {
      this.peerConnection.ontrack = null;
      this.peerConnection.onicecandidate = null;
      this.peerConnection.onconnectionstatechange = null;
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.isRemoteDescriptionSet = false;
    this.iceCandidateQueue = [];

    if (this.remoteAudioElement) {
      this.remoteAudioElement.srcObject = null;
    }
  }

  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }
}

window.WebRTCVoiceClient = WebRTCVoiceClient;
