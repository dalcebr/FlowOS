# 💻 FlowOS

**A personal Web Operating System that runs on your phone and is accessed from any browser.**

FlowOS turns your Android phone (via Termux) into a lightweight server. The phone is the CPU; the browser is the monitor. Access it from any device on your local network.

## Features

- **Lock screen** with clock, date, and user avatar — just like a real OS
- **Window manager** with drag, resize, maximize, minimize, snap, and z-order
- **Taskbar** with running apps, system tray, real-time CPU/RAM, clock
- **Terminal** — real shell access to your phone, full command execution
- **File Manager** — browse, view, rename, delete, create files and folders
- **Settings** — system info, network, storage, battery, CPU, memory, display
- **Dark acrylic theme** inspired by Windows 11 Fluent Design
- **Zero frameworks** — pure HTML/CSS/JS, optimized for old hardware

## Quick Install (Termux)

```bash
pkg update && pkg install -y nodejs-lts git
git clone https://github.com/user/flow-os.git ~/flow-os
cd ~/flow-os && npm install
cp .env.example .env
nano .env  # set your username and password
node server.js
```

Open **http://localhost:3000** on your phone, or the Network IP from any device.

## Configuration

Edit `.env`:

```env
USERNAME=seu_nome
PASSWORD=sua_senha
PORT=3000
SESSION_SECRET=qualquer-string-aleatoria
```

## Keep it running

```bash
pkg install tmux
tmux new -s flow
cd ~/flow-os && node server.js
# Ctrl+B then D to detach — server keeps running
# tmux attach -t flow  to come back
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js + Express |
| Frontend | Vanilla HTML/CSS/JS |
| Auth | Cookie-based sessions |
| Target | Termux on Android (4 GB RAM) |

## Project Structure

```
flow-os/
├── server.js           # Express backend — auth, terminal, files, metrics
├── public/
│   ├── index.html      # Single-page shell
│   ├── style.css       # Acrylic dark theme
│   ├── script.js       # Window manager + core UI
│   └── apps/
│       ├── terminal.js # Real shell emulator
│       ├── files.js    # File browser
│       └── settings.js # System settings panel
├── .env.example
├── package.json
└── README.md
```

## License

MIT
