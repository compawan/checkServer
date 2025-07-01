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

//let lastFrame = null;
const frames = {};  // store frames per device

// static serving
app.use(express.static(join(process.cwd(), "public")));

// allow large uploads
app.use(express.raw({ type: "image/jpeg", limit: "5mb" }));

app.post("/upload", (req, res) => {
  const deviceId = req.header("X-Device-Id") || "default";
  lastFrame = req.body;
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

  const interval = setInterval(() => {
    const lastFrame = frames[deviceId];
    if (lastFrame) {
      res.write(`--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${lastFrame.length}\r\n\r\n`);
      res.write(lastFrame);
      res.write("\r\n");
    }
  }, 40);

  req.on("close", () => {
    clearInterval(interval);
  });
});


// handle Socket.IO messages
io.on("connection", socket => {
  console.log("✅ client connected");

  socket.on("touch", data => {
    console.log("touch received", data);
    // if needed, forward to other devices:
    socket.broadcast.emit("touch", data);
  });

  socket.on("key", data => {
    console.log("key received", data);
    socket.broadcast.emit("key", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ client disconnected");
  });
});

// listen on the Render-assigned port
const port = process.env.PORT || 8080;
httpServer.listen(port, () => {
  console.log(`🚀 Server on http://localhost:${port}`);
});
