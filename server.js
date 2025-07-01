import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { join } from "path";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

const deviceMap = new Map(); // id -> socket.id
const deviceFrames = new Map(); // id -> latest frame

// serve static
app.use(express.static(join(process.cwd(), "public")));
app.use(express.raw({ type: "image/jpeg", limit: "5mb" }));

app.post("/upload", (req, res) => {
  const id = req.headers["x-device-id"];
  if (!id) return res.status(400).send("missing id");
  deviceFrames.set(id, req.body);
  res.sendStatus(200);
});

app.get("/stream", (req, res) => {
  const id = req.query.id;
  if (!deviceMap.has(id)) {
    res.status(404).end("Device not found or not connected.");
    return;
  }

  res.writeHead(200, {
    "Content-Type": "multipart/x-mixed-replace; boundary=frame",
  });

  const intv = setInterval(() => {
    const frame = deviceFrames.get(id);
    if (frame) {
      res.write(`--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${frame.length}\r\n\r\n`);
      res.write(frame);
      res.write("\r\n");
    }
  }, 50);

  req.on("close", () => clearInterval(intv));
});

io.on("connection", (socket) => {
  console.log("✅ socket connected", socket.id);

  socket.on("register_device", (data) => {
    console.log(`✅ device registered: ${data.id}`);
    deviceMap.set(data.id, socket.id);
  });

  socket.on("viewer_connect", (data) => {
    if (deviceMap.has(data.id)) {
      console.log(`✅ viewer connected to device ${data.id}`);
      socket.join(data.id);
    } else {
      console.log(`⚠️ invalid viewer id ${data.id}`);
    }
  });

  socket.on("touch", (data) => {
    if (data.id && deviceMap.has(data.id)) {
      io.to(deviceMap.get(data.id)).emit("touch", data);
    }
  });

  socket.on("key", (data) => {
    if (data.id && deviceMap.has(data.id)) {
      io.to(deviceMap.get(data.id)).emit("key", data);
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ disconnected ${socket.id}`);
    for (const [id, sid] of deviceMap.entries()) {
      if (sid === socket.id) {
        deviceMap.delete(id);
        deviceFrames.delete(id);
      }
    }
  });
});

httpServer.listen(8080, () => {
  console.log("🚀 on http://localhost:8080");
});
