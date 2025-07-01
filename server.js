const express = require("express");
const app = express();
const port = process.env.PORT || 8080;

let lastFrame = null;

// allow larger payloads
app.use(express.raw({ type: "image/jpeg", limit: "5mb" }));

// route for Android to POST the JPEG frames
app.post("/upload", (req, res) => {
  lastFrame = req.body;
  res.sendStatus(200);
});

// MJPEG streaming route for browsers
app.get("/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "multipart/x-mixed-replace; boundary=frame",
    "Cache-Control": "no-cache",
    "Connection": "close",
    "Pragma": "no-cache"
  });

  const interval = setInterval(() => {
    if (lastFrame) {
      res.write(`--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${lastFrame.length}\r\n\r\n`);
      res.write(lastFrame);
      res.write("\r\n");
    }
  }, 40); // ~25fps (1000/25=40ms)

  req.on("close", () => {
    clearInterval(interval);
  });
});

app.listen(port, () => {
  console.log(`📡 MJPEG server running at http://localhost:${port}/stream`);
});
