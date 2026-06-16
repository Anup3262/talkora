const express = require("express");
const { v4: uuidv4 } = require("uuid");

const Meeting = require("../models/Meeting");

const router = express.Router();

function isLoggedIn(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  next();
}

router.get("/dashboard", isLoggedIn, async (req, res) => {
  const meetings = await Meeting.find({
    $or: [
      { createdBy: req.session.user.id },
      { joinedUsers: req.session.user.id },
    ],
  }).sort({ createdAt: -1 });

  res.render("dashboard", {
    user: req.session.user,
    meetings,
  });
});

router.post("/create-room", isLoggedIn, async (req, res) => {
  const roomId = uuidv4();

  await Meeting.create({
    roomId,
    createdBy: req.session.user.id,
    joinedUsers: [req.session.user.id],
  });

  res.redirect(`/room/${roomId}`);
});

router.post("/join-room", isLoggedIn, async (req, res) => {
  const { roomId } = req.body;

  let meeting = await Meeting.findOne({ roomId });

  if (!meeting) {
    meeting = await Meeting.create({
      roomId,
      createdBy: req.session.user.id,
      joinedUsers: [req.session.user.id],
    });
  } else {
    if (!meeting.joinedUsers.includes(req.session.user.id)) {
      meeting.joinedUsers.push(req.session.user.id);
      await meeting.save();
    }
  }

  res.redirect(`/room/${roomId}`);
});

router.get("/room/:roomId", isLoggedIn, async (req, res) => {
  res.render("room", {
    roomId: req.params.roomId,
    user: req.session.user,
  });
});

module.exports = router;