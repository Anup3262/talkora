const socket = io();

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

let localStream;
let peerConnection;

const servers = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

async function init() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localVideo.srcObject = localStream;

    socket.emit("join-room", ROOM_ID, USER_ID);
  } catch (error) {
    alert("Camera or microphone permission denied");
    console.log(error);
  }
}

function createPeerConnection() {
  peerConnection = new RTCPeerConnection(servers);

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", {
        candidate: event.candidate,
      });
    }
  };
}

socket.on("user-connected", async () => {
  createPeerConnection();

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  socket.emit("offer", {
    offer,
  });
});

socket.on("offer", async (data) => {
  createPeerConnection();

  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.offer)
  );

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  socket.emit("answer", {
    answer,
  });
});

socket.on("answer", async (data) => {
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.answer)
  );
});

socket.on("ice-candidate", async (data) => {
  if (peerConnection) {
    await peerConnection.addIceCandidate(
      new RTCIceCandidate(data.candidate)
    );
  }
});

function toggleMic() {
  const audioTrack = localStream.getAudioTracks()[0];
  audioTrack.enabled = !audioTrack.enabled;
}

function toggleCamera() {
  const videoTrack = localStream.getVideoTracks()[0];
  videoTrack.enabled = !videoTrack.enabled;
}

function copyRoomId() {
  navigator.clipboard.writeText(ROOM_ID);
  alert("Room ID copied");
}

function sendMessage() {

    const input =
      document.getElementById("messageInput");

    const message = input.value;

    socket.emit("send-message", {
        roomId: ROOM_ID,
        user: USER_ID,
        message
    });

    input.value = "";
}

socket.on("receive-message", (data) => {

    const messages =
      document.getElementById("messages");

    messages.innerHTML += `
        <p>
          <b>${data.user}</b> :
          ${data.message}
        </p>
    `;
});

init();