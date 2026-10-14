Talkora — Real-Time Video Calling Platform
[!Node.js](https://nodejs.org/)
[!Express](https://expressjs.com/)
[!MongoDB](https://www.mongodb.com/)
[!Socket.IO](https://socket.io/)
[!WebRTC](https://webrtc.org/)
[!License: MIT](LICENSE)
A full-stack, real-time video calling web app. Users register, log in, create or join meeting rooms, and get low-latency peer-to-peer audio/video calls with in-call text chat — no plugins, just the browser.
Status: Working 1:1 video calls + chat. See Known limitations for what's next.

✨ Features
User authentication — register/login with bcrypt-hashed passwords (10 salt rounds) and server-side sessions
Meeting rooms — create rooms with unguessable UUID v4 IDs, or join via a shared room ID
1:1 video & audio calls — true peer-to-peer media via WebRTC (RTCPeerConnection), no media server in the middle
In-call chat — real-time messaging relayed over Socket.IO
Call controls — mute mic, toggle camera, copy room ID, leave meeting
Meeting history — dashboard lists rooms you created or joined, newest first
Session-protected routes — dashboard and rooms require login

🛠 Tech Stack
Layer
Technology
Runtime
Node.js + Express 5
Real-time signaling
Socket.IO
Media
WebRTC (P2P mesh), Google public STUN
Database
MongoDB + Mongoose (users, meetings)
Auth
bcrypt + express-session
Views
EJS (server-rendered)
Frontend
Vanilla JS, HTML, CSS

🏗 Architecture
Talkora uses a mesh P2P topology: the Node.js server handles signaling only (exchanging SDP offers/answers and ICE candidates over Socket.IO). Audio/video streams flow directly between the two browsers — the server never sees media, which keeps latency low and the server cheap.
sequenceDiagram
    participant A as Browser A (caller)
    participant S as Node.js + Socket.IO<br/>(signaling only)
    participant B as Browser B (joiner)
    participant DB as MongoDB

    A->>S: POST /create-room
    S->>DB: save Meeting { roomId: uuid }
    A->>S: join-room(roomId)
    S->>S: socket.join(roomId)
    B->>S: join-room(roomId)
    S->>A: user-connected
    A->>A: createOffer()
    A->>S: offer { sdp }
    S->>B: offer { sdp }
    B->>B: setRemoteDescription + createAnswer()
    B->>S: answer { sdp }
    S->>A: answer { sdp }
    A<->B: ice-candidate (via S, relayed both ways)
    A<->B: 🔊🎥 media flows P2P (server out of the loop)
    A->>S: send-message { roomId, user, message }
    S->>B: receive-message
Socket.IO event contract
Event
Direction
Payload
Purpose
join-room
client → server
(roomId, userId)
Join the Socket.IO room; triggers user-connected for existing peers
user-connected
server → room
(userId)
A new peer joined — existing peer creates the WebRTC offer
offer
both ways (relayed)
{ offer: RTCSessionDescription }
SDP offer
answer
both ways (relayed)
{ answer: RTCSessionDescription }
SDP answer
ice-candidate
both ways (relayed)
{ candidate: RTCIceCandidate }
NAT traversal candidate
user-disconnected
server → room
(userId)
A peer left / socket dropped
send-message
client → server
{ roomId, user, message }
Chat message
receive-message
server → room
{ user, message }
Broadcast chat message

📁 Project Structure
talkora/
├── app.js              # Express setup, session, MongoDB connect, Socket.IO signaling
├── routes/
│   ├── auth.js         # register / login / logout
│   └── meeting.js      # dashboard, create-room, join-room, room view
├── models/
│   ├── User.js         # name, email (unique), password hash
│   └── Meeting.js      # roomId, createdBy, joinedUsers
├── views/              # EJS templates: login, register, dashboard, room
├── public/
│   ├── js/room.js      # WebRTC peer connection + Socket.IO client logic
│   └── css/style.css
├── .env.example        # required environment variables
└── package.json

🚀 Getting Started
Prerequisites
Node.js 18+
MongoDB (local or MongoDB Atlas free tier)
1. Clone and install
git clone https://github.com/Anup3262/talkora.git
cd talkora
npm install
2. Configure environment
cp .env.example .env
# then edit .env with your values
Variable
Required
Example
MONGO_URI
✅
mongodb://localhost:27017/talkora
PORT
❌ (default 3000)
3000
SESSION_SECRET
✅
a long random string
Generate a secret with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
3. Run
npm run dev   # with auto-reload (nodemon)
# or
npm start
Open http://localhost:3000 → register → create a room → share the room ID → the other person joins at the same URL after logging in.
Note: browsers require HTTPS (or localhost) for camera/mic access. For testing across devices on a LAN, serve over HTTPS or use a tunnel like ngrok.

📸 Screenshots / Demo
<!-- Add 2–3 screenshots here: dashboard, in-call view, chat. A 10-sec GIF of a call connecting is worth more than any paragraph. -->
[ ] Dashboard with meeting history
[ ] In-call view (local + remote video)
[ ] Live demo link (deploy on Render/Railway)

⚠️ Known Limitations & Roadmap
Honest constraints of the current build — and the plan:
[ ] 1:1 calls only — the client keeps a single RTCPeerConnection; 3+ participants need a peer-connection map and dynamic video grid
[ ] STUN only, no TURN — calls can fail on restrictive corporate/symmetric NATs; add a TURN server (e.g. coturn)
[ ] Chat hardening — sanitize message rendering, show display names instead of user IDs, add timestamps
[ ] Input validation & rate limiting on auth routes
[ ] Security headers (helmet), secure cookie flags
[ ] Tests — Jest + Supertest for routes, ESLint + Prettier, GitHub Actions CI

🎤 Interview Talking Points
If you're presenting this in an interview, these are the decisions worth defending:
Why Socket.IO for signaling? WebRTC needs an out-of-band channel to exchange SDP/ICE before any P2P link exists — Socket.IO rooms map 1:1 onto meeting rooms.
Why mesh instead of an SFU (e.g. mediasoup/LiveKit)? For 1:1, mesh gives the lowest latency and zero media-server cost; the tradeoff (each peer uploads N-1 streams) is exactly why group calls need an SFU later.
STUN vs TURN: STUN discovers your public address for direct P2P; when NATs block it, a TURN relay is the fallback — currently the documented gap.
Why UUID room IDs? Unguessable, no sequential enumeration, safe to share as links.
Session auth over JWT here: server-rendered EJS pages + express-session keeps auth simple and revocable; JWT would fit a stateless API/mobile client.

📄 License
MIT — see LICENSE for details.
