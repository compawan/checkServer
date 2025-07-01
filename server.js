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

// Maps to store device info
const deviceMap = new Map();         // id -> device socket.id
const deviceFrames = new Map();       // id -> lastFrame

// static serving
app.use(express.static(join(process.cwd(), "public")));

// allow large image uploads from Android
app.use(express.raw({ type: "image/jpeg", limit: "5mb" }));

// device uploads its JPEG frames
app.post("/upload", (req, res) => {
  const id = req.headers["x-device-id"];
  if (!id) {
    res.status(400).send("Missing device ID header");
    return;
  }
  deviceFrames.set(id, req.body);
  res.sendStatus(200);
});

// stream MJPEG to web viewer
app.get("/stream", (req, res) => {
  const requestedId = req.query.id;
  if (!deviceMap.has(requestedId)) {
    res.status(404).end("Device not found or not connected.");
    return;
  }

  res.writeHead(200, {
    "Content-Type": "multipart/x-mixed-replace; boundary=frame",
    "Cache-Control": "no-cache",
    "Connection": "close",
    "Pragma": "no-cache"
  });

  const interval = setInterval(() => {
    const frame = deviceFrames.get(requestedId);
    if (frame) {
      res.write(`--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${frame.length}\r\n\r\n`);
      res.write(frame);
      res.write("\r\n");
    }
  }, 40);

  req.on("close", () => {
    clearInterval(interval);
  });
});

// handle Socket.IO messages
io.on("connection", socket => {
  console.log(`✅ Socket.IO client connected from ${socket.handshake.address}`);

  // device registers itself with an ID
  socket.on("register_device", data => {
    console.log("✅ device registered with ID:", data.id);
    deviceMap.set(data.id, socket.id);
  });

  // web viewer connects by entering ID
  socket.on("viewer_connect", data => {
    const deviceSocketId = deviceMap.get(data.id);
    if (deviceSocketId) {
      console.log(`✅ viewer connected to device ${data.id}`);
      socket.join(data.id); // join socket.io room
    } else {
      console.log(`⚠️ viewer tried invalid device ID: ${data.id}`);
    }
  });

  // viewer sends touch, forward to device
  socket.on("touch", data => {
    if (data.id && deviceMap.has(data.id)) {
      const deviceSocketId = deviceMap.get(data.id);
      io.to(deviceSocketId).emit("touch", data);
    }
  });

  // viewer sends key, forward to device
  socket.on("key", data => {
    if (data.id && deviceMap.has(data.id)) {
      const deviceSocketId = deviceMap.get(data.id);
      io.to(deviceSocketId).emit("key", data);
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ Socket.IO client disconnected`);
    // optionally cleanup devices:
    for (const [id, sockId] of deviceMap.entries()) {
      if (sockId === socket.id) {
        console.log(`❌ device removed with ID ${id}`);
        deviceMap.delete(id);
        deviceFrames.delete(id);
      }
    }
  });
});

// start the server
const port = process.env.PORT || 8080;
httpServer.listen(port, () => {
  console.log(`🚀 Server on http://localhost:${port}`);
});
