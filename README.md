﻿# screenShareMJPEG

---

# 📺 screenShareMJPEG

**screenShareMJPEG** is a lightweight Node.js-based screen sharing server that streams your desktop using MJPEG (Motion JPEG) over HTTP. Perfect for LAN-based screen sharing, remote presentations, or lightweight monitoring without needing heavy streaming software.

---

## 🚀 Features

* 🖥️ Live screen capture in real-time
* 🌐 MJPEG streaming via HTTP
* ⚡ Simple, minimal, and efficient
* 🔒 Local-first: no external cloud dependencies
* 🧩 Cross-platform (Windows, macOS, Linux)

---

## 📦 Installation

### Requirements

* Node.js (v14+ recommended)
* A compatible screen capture utility:

  * `screenshot-desktop` (cross-platform)
  * or use `robotjs`, `node-webkit`, or custom grabber

### Install dependencies:

```bash
npm install
```

---

## 🧪 Usage

### Start the server:

```bash
node server.js
```

By default, it runs on `http://localhost:8080`.

### View the stream:

Open a browser and go to:

```
http://<your-ip>:8080
```

You’ll see a live MJPEG stream of your screen.

---

## ⚙️ Configuration

You can modify the following parameters in the `server.js` or via CLI (if implemented):

* **Port**: Change from default 8080
* **FPS**: Frames per second (adjust capture interval)
* **Resolution**: Optional scaling
* **Region**: Crop specific screen region (if supported)

Example with CLI (if supported):

```bash
node server.js --port 9000 --fps 10
```

---

## 🛠️ How It Works

1. Captures screenshots at a defined interval
2. Converts each image to JPEG format
3. Streams the images over a multipart HTTP response as MJPEG

---

## 📷 Preview

> Add a screenshot or GIF here to demo the interface.

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

Pull requests and issues are welcome!

To contribute:

1. Fork the repo
2. Create your feature branch
3. Submit a PR with a clear explanation

---

## 📚 Credits

Built with:

* [`screenshot-desktop`](https://github.com/bencevans/screenshot-desktop)
* Native Node.js HTTP server
* JPEG + multipart streaming

---


