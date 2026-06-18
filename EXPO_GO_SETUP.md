# Expo Go — Setup & Run Guide (AATOS Rebranding Mobile)

How to run this app on a physical phone with **Expo Go**, and how to preview it
in the browser. Written so the setup survives a PC migration — everything you
need is in this repo.

> Stack: Expo SDK 54 · React Native 0.81 · React 19 · TypeScript.
> Metro runs on port **8081**, the web preview on port **8083**.

---

## 0. First time on a new PC

```bash
git clone <this-repo>
cd AATOS_REBRANDING_MOBILE
npm install            # installs expo, @expo/ngrok (for --tunnel), etc.
```

Install **Expo Go** on the phone (App Store / Play Store). No native build
needed — this project runs fully inside Expo Go.

---

## 1. Run on the phone

There are three connection modes. Pick based on your network situation.

### A. LAN (fastest — phone + PC on the same Wi‑Fi, **VPN OFF**)

```bash
npm run start          # == expo start --lan   (port 8081)
# or the helper that auto-detects your IP and prints the URL:
powershell -ExecutionPolicy Bypass -File ./start-expo-go.ps1
```

Then in **Expo Go → "Enter URL manually"** paste:

```
exp://<YOUR-PC-IP>:8081
```

`start-expo-go.ps1` auto-detects the first `192.168.x.x` address, sets
`REACT_NATIVE_PACKAGER_HOSTNAME`, and prints the exact `exp://` URL.
`expo-go-connect.html` is a small local page that shows the same URL — open it
in a browser on the PC to read/copy the link.

> ⚠️ On a new PC the LAN IP changes. The PS1 script detects it automatically.
> The hardcoded fallback (`192.168.1.138`) inside `start-expo-go.ps1` and
> `expo-go-connect.html` is just a default — update it to your new PC's IP if
> you rely on the static HTML page.

### B. Cloudflare tunnel (different networks, or LAN blocked)

Use this when the phone and PC are **not** on the same LAN, or when a VPN/router
blocks LAN discovery.

```bash
npm run start:remote   # == start-expo-remote.ps1
```

`start-expo-remote.ps1`:
1. Kills anything on port 8081.
2. Starts Metro (`npx expo start --port 8081`).
3. Opens a Cloudflare tunnel (`npx --yes cloudflared tunnel --url http://127.0.0.1:8081`).
4. Prints a public `exp://<random>.trycloudflare.com` URL — paste that into
   Expo Go → "Enter URL manually".

`expo-go-remote.html` is the matching helper page.

### C. Expo's built-in tunnel (ngrok)

```bash
npx expo start --tunnel
```

Uses `@expo/ngrok` (already a devDependency). **This is the known-good fallback
when NordVPN is on** — NordVPN blocks LAN discovery, so plain `--lan` fails and
the tunnel is required.

---

## 2. Browser preview (verification, no phone needed)

```bash
npm run web            # == expo start --web --localhost --port 8083
```

Opens the app via **react-native-web** on `http://localhost:8083`. This is what
the Claude preview tools attach to for visual verification. Note that some
native-only modules (e.g. `expo-audio` mic capture) are stubbed/limited on web —
device behavior is the source of truth for those.

There is also `npm run web:tunnel` (`expo start --web --tunnel`) if you need the
web build reachable from another device.

---

## 3. All npm scripts (from package.json)

| Script               | Command                                              | Use |
|----------------------|------------------------------------------------------|-----|
| `start`              | `expo start --lan`                                   | Default device run (LAN) |
| `start:lan`          | `expo start --lan`                                   | Same as above |
| `start:local`        | `expo start --localhost`                             | Emulator on the same machine |
| `start:remote`       | `powershell … start-expo-remote.ps1`                 | Cloudflare tunnel (cross-network) |
| `android`            | `expo start --lan --android`                         | Launch on Android |
| `ios`                | `expo start --lan --ios`                             | Launch on iOS |
| `web`                | `expo start --web --localhost --port 8083`           | Browser preview |
| `web:tunnel`         | `expo start --web --tunnel`                          | Browser preview, public URL |

---

## 4. Helper files in this repo

| File                     | Purpose |
|--------------------------|---------|
| `start-expo-go.ps1`      | LAN start: auto-detect IP, set packager hostname, print `exp://IP:8081`. |
| `expo-go-connect.html`   | Local page showing the LAN `exp://` URL to copy. |
| `start-expo-remote.ps1`  | Metro + Cloudflare tunnel; prints a public `exp://…trycloudflare.com` URL. |
| `expo-go-remote.html`    | Local page for the remote/tunnel flow. |

---

## 5. Quick troubleshooting

- **Expo Go can't connect on LAN** → VPN is on (NordVPN blocks LAN). Turn VPN
  off, or use mode **B**/**C** (tunnel).
- **Wrong/old IP** → run `start-expo-go.ps1` (auto-detects) instead of the static
  HTML; or update the IP in the HTML.
- **Port 8081 busy** → `start-expo-remote.ps1` frees it automatically; otherwise
  kill the process holding 8081.
- **"Enter URL manually"** is the reliable path in Expo Go — QR scanning can fail
  behind VPNs/firewalls.
