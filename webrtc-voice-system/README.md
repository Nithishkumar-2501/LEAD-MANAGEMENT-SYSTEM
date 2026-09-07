# In-Browser WebRTC Voice Calling System (College Admission Portal)

A production-grade, peer-to-peer in-browser voice calling system built with **Node.js**, **Socket.io**, and native **WebRTC** (`RTCPeerConnection` & `getUserMedia`) where phone numbers are **100% completely masked and protected**.

---

## 🏛️ Architecture & Phone Number Masking

### 1. Privacy First Architecture (Zero Phone Numbers on the Wire)
In traditional systems, phone numbers are transmitted across signaling and SIP channels. In this architecture:
- **Signaling Identity:** Uses ephemeral/system user IDs (`teacher_dhanabal_101`, `student_priya_2026`).
- **WebRTC SDP:** WebRTC Session Description Protocol (SDP) contains purely session hashes, codecs (Opus 48kHz), and STUN candidates. No phone numbers are embedded in SDP attributes or socket payloads.
- **Student View:** The incoming call modal displays:
  > **"V.S.B. Engineering College Admissions Office is calling..."**  
  > Counselor: Dr. Dhanabal M (Department of Central Admissions)
- **Teacher View:** The counselor views the candidate's name, application interest, and a securely masked number (`+91 ••••• ••••12`).

```
[Teacher Browser (Microphone)]
             │
             ├── 1. initiate-call (toUserId: 'student_priya_2026') ──┐
             │                                                       ▼
             │                                              [Node.js + Socket.io]
             │                                              [ Signaling Server  ]
             │                                                       │
             │   ┌── 2. incoming-call ('Admissions Office') ─────────┘
             ▼   ▼
[Student Browser (Incoming Call Modal)]
             │
             ├── 3. accept-call (callId) ──► [Signaling Server]
             │                                       │
             │   ◄── 4. call-accepted ───────────────┘
             ▼
[WebRTC Handshake: SDP Offer / Answer + ICE Candidates via Socket.io]
             │
             ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Direct P2P Encrypted Audio Stream (Opus Codec via Google STUN)        │
│  - Live Audio Waveform Canvas Visualizer                               │
│  - Call Duration Timer                                                 │
│  - Microphone Mute / Unmute Toggle                                     │
│  - Instant Hang Up & Track Teardown                                    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start & Running Locally

### Step 1: Install Dependencies
```bash
cd webrtc-voice-system
npm install
```

### Step 2: Start the Signaling Server
```bash
npm start
```
The server will boot on port `5000`:
```
=============================================================
🚀 WebRTC Voice Calling Signaling Server is RUNNING!
🌐 Local Server URL: http://localhost:5000
👨‍🏫 Teacher Dashboard:  http://localhost:5000/teacher.html
🎓 Student Portal:     http://localhost:5000/student.html
📱 Dual-Test Launcher: http://localhost:5000/index.html
=============================================================
```

---

## 🧪 How to Test

### Option A: Dual-Screen Sandbox (Single Screen)
1. Open your browser and navigate to:
   ```
   http://localhost:5000/index.html
   ```
2. The page loads the **Teacher Calling Dashboard** on the left and the **Student Portal** on the right in synchronized frames.
3. Allow microphone permissions when prompted.
4. On the left panel (Teacher), click **"Start Voice Call"** next to **Priya Dharshini S**.
5. The right panel (Student) immediately pops up the **Incoming Audio Call Modal** with ringing sound and pulsing rings:
   > *"V.S.B. Engineering College is calling..."*
6. Click **[Accept Call]** on the Student panel.
7. Both panels transition into the active call state:
   - Live sound wave canvas displays voice frequencies.
   - Timer counts up.
   - You can test **Mute Mic** and **End Call**.

### Option B: Two Independent Browser Windows
1. Window 1: `http://localhost:5000/teacher.html`
2. Window 2: `http://localhost:5000/student.html`
3. Click "Start Voice Call" in Window 1 and accept in Window 2!

---

## 🔧 WebRTC Reliability & Engineering Highlights

1. **ICE Candidate Queuing Buffer:**
   - Prevents the classic WebRTC race condition where remote ICE candidates arrive *before* `setRemoteDescription` resolves. All premature candidates are queued and flushed once the remote description is active.
2. **Audio Constraints:**
   - Configured with `echoCancellation: true`, `noiseSuppression: true`, and `autoGainControl: true` for crisp voice reproduction.
3. **Web Audio API Dual-Tone Ringtone Synthesizer:**
   - Synthesizes realistic 440Hz + 480Hz dual-frequency chime tones using native `OscillatorNode` and `GainNode`, with zero external audio assets required.
4. **Live Audio Frequency Visualizer:**
   - Real-time `AnalyserNode` connected to the remote audio stream renders animated voice waves on HTML5 `<canvas>`.
5. **Clean Resource Teardown:**
   - `stream.getTracks().forEach(t => t.stop())` stops hardware capture immediately upon hangup, turning off the browser microphone indicator.
