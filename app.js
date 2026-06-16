require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth");
const meetingRoutes = require("./routes/meeting");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
  })
);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.use("/", authRoutes);
app.use("/", meetingRoutes);

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);

    socket.on("send-message", (data) => {
    io.to(data.roomId).emit("receive-message", {
        user: data.user,
        message: data.message
    });
});

    socket.on("offer", (data) => {
      socket.to(roomId).emit("offer", data);
    });

    socket.on("answer", (data) => {
      socket.to(roomId).emit("answer", data);
    });

    socket.on("ice-candidate", (data) => {
      socket.to(roomId).emit("ice-candidate", data);
    });

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});