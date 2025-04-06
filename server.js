const express = require("express");
const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);
const path = require("path");

const PORT = 5000;

let waitingSocket = null;

// Serve the frontend
app.use(express.static(path.join(__dirname, "frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  const pairStrangers = () => {
    if (waitingSocket && waitingSocket !== socket) {
      const partner = waitingSocket;
      const roomId = socket.id + "#" + partner.id;

      socket.join(roomId);
      partner.join(roomId);

      socket.partner = partner;
      partner.partner = socket;

      socket.roomId = roomId;
      partner.roomId = roomId;

      io.to(roomId).emit("message", {
        name: "System",
        message: "You are now connected to a stranger.",
      });

      waitingSocket = null;
    } else {
      waitingSocket = socket;
      socket.emit("message", {
        name: "System",
        message: "Waiting for a stranger...",
      });
    }
  };

  pairStrangers();

  // Handle message sending
  socket.on("message", (msg) => {
    if (socket.partner) {
      socket.partner.emit("message", {
        name: "Stranger",
        message: msg,
      });
    } else {
      socket.emit("message", {
        name: "System",
        message: "Stranger not connected.",
      });
    }
  });

  // Handle skip event (renamed from 'next' to match frontend)
  socket.on("skip", () => {
    if (socket.partner) {
      socket.partner.emit("message", {
        name: "System",
        message: "Stranger has skipped the chat.",
      });
      socket.partner.partner = null;
      pairStrangers.call(socket.partner);
    }

    socket.partner = null;
    pairStrangers();
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    if (waitingSocket === socket) {
      waitingSocket = null;
    }

    if (socket.partner) {
      socket.partner.emit("message", {
        name: "System",
        message: "Stranger has disconnected.",
      });
      socket.partner.partner = null;
    }
  });
});

// Start the server
http.listen(PORT, () => {
  console.log('Server running at http://localhost:3000');
});