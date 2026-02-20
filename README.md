# ChatApp Frontend

This repository contains the frontend client for a real-time chat application.

## Features

- Google OAuth sign-in flow
- Real-time 1:1 chat over WebSockets
- Typing indicator support
- Friend list with search
- Send and accept friend requests
- Presence status (online/last seen)
- Basic profile view for logged-in users

## Tech Stack

- React 18
- React Router
- MDB React UI Kit + Bootstrap
- Plain CSS styling
- Fetch API for backend communication
- Native WebSocket API for live messages
- Create React App (`react-scripts`) build tooling

## Project Layout

- `frontend/` – React application source and assets
- `frontend/src/pages/` – route-level pages (Login, Profile, Dashboard)
- `frontend/src/components/Chatscreen/` – chat UI and interaction logic

## Getting Started

```bash
cd frontend
npm install
npm start
```

## Environment Variable

Create `frontend/.env` and set:

```bash
REACT_APP_BASE_URL=http://<backend-host>
```
