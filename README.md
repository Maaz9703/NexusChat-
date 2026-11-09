# NexusChat — Real-time Messaging App

A WhatsApp-style chat app for web and Android. Built with **Next.js 16, TypeScript, MongoDB (Mongoose)** and **Pusher** for real-time delivery, with a **Capacitor** Android build. Deployed on **Vercel**.

**Live demo:** https://nexus-chat-puce.vercel.app
→ Click **“Try as Guest — no sign-up”**, then chat with the built-in **Nexus Assistant** — or open the site in a second browser to message yourself.

## Features

- One-to-one chats with message history, delivery/read ticks and online status
- Contact directory with search; start a new chat from any contact
- Built-in assistant contact that replies instantly (great for demos)
- Real-time updates via Pusher; automatic fallback to polling when Pusher isn’t configured
- Animated 3D background (React Three Fiber) and a responsive, mobile-first UI
- Android app packaged with Capacitor (GitHub Actions workflow builds the APK)

## Security

- Accounts use mobile number + password (salted **scrypt** hashes)
- Sessions are **signed, httpOnly cookies** — the server decides who is sending, never the browser
- Users can only read and post in chats they belong to
- Phone numbers are never exposed through the API

## Tech stack

Next.js 16 · React 19 · TypeScript · MongoDB / Mongoose · Pusher · Framer Motion · React Three Fiber · Capacitor

## Run locally

```bash
npm install
npm run dev
```

`.env.local`:

```
MONGODB_URL=<MongoDB connection string>
SESSION_SECRET=<long random string>
# Optional real-time
PUSHER_APP_ID=  PUSHER_SECRET=
NEXT_PUBLIC_PUSHER_KEY=  NEXT_PUBLIC_PUSHER_CLUSTER=
```

## API

| Method | Route | Description |
| --- | --- | --- |
| GET / POST / DELETE | `/api/auth` | current user · sign in / register / guest · sign out |
| GET / POST | `/api/chats` | my chats · open a chat with a user |
| GET / POST | `/api/messages?chatId=` | messages in my chat · send a message |
| GET | `/api/users` | contacts (no phone numbers) |

---

Built by [Maaz](https://github.com/Maaz9703).
