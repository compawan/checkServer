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




/*
import WebSocket from 'ws';

const wss = new WebSocket.Server({ port: 8081 });

wss.on('connection', ws => {
    console.log("New client connected");

    ws.on('message', msg => {
        console.log("Received:", msg);

        // forward messages to every other client
        wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(msg);
            }
        });
    });

    ws.on('close', () => {
        console.log("Client disconnected");
    });
});  */