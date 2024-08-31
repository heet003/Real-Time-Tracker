const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();
const app = express();
const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: `${process.env.FRONTEND_DEPLOY_URL}`,
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
    origin: `${process.env.FRONTEND_DEPLOY_URL}`,
    methods: ["GET", "POST"],
    credentials: true,
  })
);

io.on("connection", (socket) => {
  console.log(socket.id);

  socket.on("location-send", (data) => {
    io.emit("recieve", { id: socket.id, ...data });
    console.log(data);
  });

  socket.on("disconnect", () => {
    io.emit("user-disconnect", socket.id);
  });
});

server.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}/`);
});
