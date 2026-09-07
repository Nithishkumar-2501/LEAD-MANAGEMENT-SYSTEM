/**
 * ============================================================================
 * WebRTC Audio Signaling Server - College Admission Portal (SPHEREX CRM)
 * ============================================================================
 * 
 * Architectural Highlights:
 * 1. Complete Phone Masking:
 *    - Signaling exchange routes strictly via ephemeral/application `userId`.
 *    - Phone numbers NEVER touch the signaling payloads or SDP attributes.
 * 2. Robust State Management:
 *    - Tracks user availability, prevents multiple concurrent calls (busy state).
 * 3. Bidirectional WebRTC Signaling:
 *    - Relays `offer`, `answer`, `ice-candidate`, `incoming-call`, and `hangup`.
 * 4. Static Hosting:
 *    - Serves both Teacher Dashboard and Student Portal clients directly.
 */

const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 5000;

// Serve public static files
app.use(express.static(path.join(__dirname, "public")));

// Serve mock applicant directory for the teacher dashboard
app.get("/api/applicants", (req, res) => {
  res.json([
    {
      id: "student_priya_2026",
      name: "Priya Dharshini S",
      email: "priya.dharshini@gmail.com",
      maskedPhone: "+91 ••••• ••••12",
      courseInterest: "B.E. Computer Science & Engineering",
      campus: "KARUR",
      tneaCutoff: 191.5,
      status: "VERIFIED",
    },
    {
      id: "student_karthik_2026",
      name: "Karthik Raja M",
      email: "karthik.raja@yahoo.com",
      maskedPhone: "+91 ••••• ••••45",
      courseInterest: "B.Tech Artificial Intelligence & Data Science",
      campus: "COIMBATORE",
      tneaCutoff: 188.0,
      status: "APP_STARTED",
    },
    {
      id: "student_ananya_2026",
      name: "Ananya Ramesh",
      email: "ananya.ramesh@outlook.com",
      maskedPhone: "+91 ••••• ••••78",
      courseInterest: "B.E. Electronics & Communication",
      campus: "KARUR",
      tneaCutoff: 194.5,
      status: "PAYMENT_APPROVED",
    },
    {
      id: "student_siddharth_2026",
      name: "Siddharth Verma",
      email: "siddharth.verma@gmail.com",
      maskedPhone: "+91 ••••• ••••33",
      courseInterest: "B.E. Mechanical Engineering",
      campus: "COIMBATORE",
      tneaCutoff: 172.5,
      status: "ENROLMENTS",
    },
  ]);
});

// In-Memory Registries
const connectedUsers = new Map(); // userId -> { socketId, userId, role, name, displayInfo, isBusy }
const socketIdToUserId = new Map(); // socketId -> userId
const activeCalls = new Map(); // callId -> { callId, callerId, calleeId, startTime }

io.on("connection", (socket) => {
  console.log(`[Socket Connected] ID: ${socket.id}`);

  // 1. User Registration Event
  socket.on("register-user", ({ userId, role, name, displayInfo }) => {
    if (!userId) return;

    // Register user
    connectedUsers.set(userId, {
      socketId: socket.id,
      userId,
      role: role || "STUDENT",
      name: name || "Anonymous User",
      displayInfo: displayInfo || {},
      isBusy: false,
    });
    socketIdToUserId.set(socket.id, userId);

    console.log(`[Registered] ${role} ${name} (${userId}) on socket ${socket.id}`);

    // Notify caller that registration succeeded
    socket.emit("registration-success", { userId, socketId: socket.id });

    // Broadcast updated online presence
    broadcastOnlineUsers();
  });

  // 2. Request Online Users
  socket.on("get-online-users", () => {
    socket.emit("online-users-list", getSanitizedOnlineUsers());
  });

  // 3. Initiate Voice Call (Teacher -> Student)
  socket.on("initiate-call", ({ toUserId, callMetadata }) => {
    const fromUserId = socketIdToUserId.get(socket.id);
    const caller = connectedUsers.get(fromUserId);
    const targetUser = connectedUsers.get(toUserId);

    if (!caller) {
      return socket.emit("call-error", { message: "You are not registered with the signaling service." });
    }

    if (!targetUser) {
      return socket.emit("call-error", {
        message: `Student portal is currently offline. Please wait until the candidate opens their portal.`,
        code: "TARGET_OFFLINE",
      });
    }

    if (targetUser.isBusy) {
      return socket.emit("call-error", {
        message: `${targetUser.name} is currently on another call.`,
        code: "TARGET_BUSY",
      });
    }

    const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Set busy flags
    caller.isBusy = true;
    targetUser.isBusy = true;

    activeCalls.set(callId, {
      callId,
      callerId: fromUserId,
      calleeId: toUserId,
      startTime: Date.now(),
    });

    console.log(`[Call Initiated] ${caller.name} -> ${targetUser.name} (Call ID: ${callId})`);

    // Notify caller that ringing has started
    socket.emit("call-ringing", {
      callId,
      toUser: {
        userId: targetUser.userId,
        name: targetUser.name,
        role: targetUser.role,
      },
    });

    // Send Incoming Call invitation to Callee (Student Portal)
    // NOTICE: Phone numbers are completely masked/absent; only official institutional credentials passed!
    io.to(targetUser.socketId).emit("incoming-call", {
      callId,
      fromUser: {
        userId: caller.userId,
        name: caller.name,
        role: "Admissions Counselor",
        department: "VSB Central Admissions Office",
        college: "V.S.B. Engineering College",
      },
      metadata: callMetadata || {},
    });

    broadcastOnlineUsers();
  });

  // 4. Accept Call (Student -> Teacher)
  socket.on("accept-call", ({ callId }) => {
    const calleeId = socketIdToUserId.get(socket.id);
    const callSession = activeCalls.get(callId);

    if (!callSession || callSession.calleeId !== calleeId) {
      return socket.emit("call-error", { message: "Call session not found or already terminated." });
    }

    const caller = connectedUsers.get(callSession.callerId);
    if (!caller) {
      return socket.emit("call-error", { message: "Caller has disconnected." });
    }

    console.log(`[Call Accepted] Call ID: ${callId} by ${calleeId}`);

    // Notify caller that call was accepted so they can trigger createOffer
    io.to(caller.socketId).emit("call-accepted", {
      callId,
      byUserId: calleeId,
    });
  });

  // 5. Decline Call (Student -> Teacher)
  socket.on("decline-call", ({ callId, reason }) => {
    const calleeId = socketIdToUserId.get(socket.id);
    const callSession = activeCalls.get(callId);

    if (callSession) {
      const caller = connectedUsers.get(callSession.callerId);
      const callee = connectedUsers.get(calleeId);

      if (caller) {
        caller.isBusy = false;
        io.to(caller.socketId).emit("call-declined", {
          callId,
          reason: reason || "Student declined the call.",
        });
      }

      if (callee) {
        callee.isBusy = false;
      }

      activeCalls.delete(callId);
      console.log(`[Call Declined] Call ID: ${callId} (Reason: ${reason || "Declined"})`);
      broadcastOnlineUsers();
    }
  });

  // 6. WebRTC SDP Offer Relay
  socket.on("webrtc-offer", ({ toUserId, offer }) => {
    const fromUserId = socketIdToUserId.get(socket.id);
    const targetUser = connectedUsers.get(toUserId);

    if (targetUser) {
      io.to(targetUser.socketId).emit("webrtc-offer", {
        fromUserId,
        offer,
      });
    }
  });

  // 7. WebRTC SDP Answer Relay
  socket.on("webrtc-answer", ({ toUserId, answer }) => {
    const fromUserId = socketIdToUserId.get(socket.id);
    const targetUser = connectedUsers.get(toUserId);

    if (targetUser) {
      io.to(targetUser.socketId).emit("webrtc-answer", {
        fromUserId,
        answer,
      });
    }
  });

  // 8. WebRTC ICE Candidate Relay
  socket.on("ice-candidate", ({ toUserId, candidate }) => {
    const fromUserId = socketIdToUserId.get(socket.id);
    const targetUser = connectedUsers.get(toUserId);

    if (targetUser) {
      io.to(targetUser.socketId).emit("ice-candidate", {
        fromUserId,
        candidate,
      });
    }
  });

  // 9. Hangup / End Call
  socket.on("end-call", ({ toUserId, callId }) => {
    const fromUserId = socketIdToUserId.get(socket.id);
    cleanupCall(callId, fromUserId, toUserId, "User terminated the call.");
  });

  // 10. Disconnect Handler
  socket.on("disconnect", () => {
    const userId = socketIdToUserId.get(socket.id);
    if (!userId) return;

    console.log(`[Socket Disconnected] ${userId} (${socket.id})`);

    // Clean up any active calls this user was part of
    for (const [callId, call] of activeCalls.entries()) {
      if (call.callerId === userId || call.calleeId === userId) {
        const partnerId = call.callerId === userId ? call.calleeId : call.callerId;
        cleanupCall(callId, userId, partnerId, "Remote peer disconnected.");
      }
    }

    connectedUsers.delete(userId);
    socketIdToUserId.delete(socket.id);
    broadcastOnlineUsers();
  });

  // Helper: Terminate Call & Reset State
  function cleanupCall(callId, initiatorId, partnerId, reason) {
    if (callId && activeCalls.has(callId)) {
      activeCalls.delete(callId);
    }

    const initiator = connectedUsers.get(initiatorId);
    if (initiator) initiator.isBusy = false;

    const partner = connectedUsers.get(partnerId);
    if (partner) {
      partner.isBusy = false;
      io.to(partner.socketId).emit("call-ended", {
        callId,
        reason: reason || "Call ended.",
      });
    }

    socket.emit("call-ended", {
      callId,
      reason: reason || "Call ended.",
    });

    console.log(`[Call Cleaned Up] Call ID: ${callId || "N/A"} - Reason: ${reason}`);
    broadcastOnlineUsers();
  }
});

// Helper: Broadcast List of Online Users
function broadcastOnlineUsers() {
  const users = getSanitizedOnlineUsers();
  io.emit("online-users-list", users);
}

function getSanitizedOnlineUsers() {
  const list = [];
  for (const [, user] of connectedUsers.entries()) {
    list.push({
      userId: user.userId,
      role: user.role,
      name: user.name,
      displayInfo: user.displayInfo,
      isBusy: user.isBusy,
    });
  }
  return list;
}

server.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`🚀 WebRTC Voice Calling Signaling Server is RUNNING!`);
  console.log(`🌐 Local Server URL: http://localhost:${PORT}`);
  console.log(`👨‍🏫 Teacher Dashboard:  http://localhost:${PORT}/teacher.html`);
  console.log(`🎓 Student Portal:     http://localhost:${PORT}/student.html`);
  console.log(`📱 Dual-Test Launcher: http://localhost:${PORT}/index.html`);
  console.log(`=============================================================\n`);
});
