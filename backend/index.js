const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();
const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_DEPLOY_URL,
  "https://real-time-tracker-zw78.onrender.com",
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const userNames = {};

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
  }
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  })
);

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("location-send", (data) => {
    const userName = userNames[socket.id] || "Unknown";
    io.emit("recieve", { id: socket.id, userName, ...data });
    console.log(data);
  });

  socket.on("update-name", (data) => {
    userNames[socket.id] = data.name;
    io.emit("update-name", { id: socket.id, name: data.name });
  });

  socket.on("disconnect", () => {
    io.emit("user-disconnect", socket.id);
    delete userNames[socket.id]; 
  });
});

server.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}/`);
});
