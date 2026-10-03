#!/data/data/com.termux/files/usr/bin/bash
set -e
echo "⚡ FlowOS — instalação"
pkg update -y
pkg install git nodejs-lts python make clang openssh unzip ripgrep jq tree -y
termux-setup-storage || true
echo
echo "Agora execute:"
echo "  cp .env.example .env"
echo "  nano .env"
echo "  npm install"
echo "  npm start"
echo
echo "Depois abra http://127.0.0.1:3000 no navegador."
