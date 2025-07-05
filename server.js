import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { join } from "path";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

// store multiple frames by device id
const frames = {};
const devices = {};
// static serving
app.use(express.static(join(process.cwd(), "public")));

// allow large uploads
app.use(express.raw({ type: "image/jpeg", limit: "5mb" }));

/*
app.post("/upload", (req, res) => {
  const deviceId = req.header("X-Device-Id") || "default";
  frames[deviceId] = req.body;
  res.sendStatus(200);
});  */

app.post("/upload", (req, res) => {
  const deviceId = req.header("X-Device-Id") || "default";
  const seq = req.header("X-Frame-Seq") || "unknown";

  frames[deviceId] = req.body;

  console.log(`📸 received frame from ${deviceId} seq ${seq}`);
  res.sendStatus(200);
});


app.get("/stream/:deviceId", (req, res) => {
  const deviceId = req.params.deviceId;

  res.writeHead(200, {
    "Content-Type": "multipart/x-mixed-replace; boundary=frame",
    "Cache-Control": "no-cache",
    "Connection": "close",
    "Pragma": "no-cache"
  });

 let interval;
function startStreaming() {
  interval = setInterval(() => {
    const currentFrame = frames[deviceId];
    if (currentFrame) {
      res.write(`--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${currentFrame.length}\r\n\r\n`);
      res.write(currentFrame);
      res.write("\r\n");
    }
  }, 40);
}

// wait until first frame arrives
const waitForFirstFrame = setInterval(() => {
  if (frames[deviceId]) {
    console.log(`🟢 First frame for ${deviceId} arrived, starting stream`);
    startStreaming();
    clearInterval(waitForFirstFrame);
  }
}, 100);


  req.on("close", () => {
    clearInterval(interval);
  });
});


// handle Socket.IO messages
/*
io.on("connection", socket => {
  console.log("✅ client connected");

  socket.on("touch", data => {
    console.log("touch received", data);
    socket.broadcast.emit("touch", data);
  });

  socket.on("key", data => {
    console.log("key received", data);
    socket.broadcast.emit("key", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ client disconnected");
  });
});  */

io.on("connection", socket => {
  console.log("✅ client connected");

  // send current devices list when a new client connects
  socket.emit("devices_update", Object.keys(devices));

  socket.on("register_device", data => {
    const id = data.id;
    devices[id] = socket;
    console.log(`📲 device registered: ${id}`);

     // broadcast to everyone
    io.emit("devices_update", Object.keys(devices));
  });

  socket.on("touch", data => {
    console.log("touch received", data);
    const deviceId = data.deviceId;
    const targetSocket = devices[deviceId];
    if (targetSocket) {
      targetSocket.emit("touch", data);
    }
  });

  socket.on("key", data => {
    console.log("key received", data);
    const deviceId = data.deviceId;
    const targetSocket = devices[deviceId];
    if (targetSocket) {
      targetSocket.emit("key", data);
    }
  });

  socket.on("disconnect", () => {
    // cleanup device
    for (const [id, sock] of Object.entries(devices)) {
      if (sock === socket) {
        delete devices[id];
        console.log(`❌ device disconnected: ${id}`);
        break;
      }
    }

     // update everyone on disconnect
    io.emit("devices_update", Object.keys(devices));
  });
});

// listen on the Render-assigned port
const port = process.env.PORT || 8080;
httpServer.listen(port, () => {
  console.log(`🚀 Server on http://localhost:${port}`);
});
