# Chat Application Frontend

A React-based frontend for a real-time chat application with Google authentication, friend management, and live messaging.

## Features

- Google OAuth login flow integration with backend auth endpoints.
- Real-time one-to-one messaging using WebSockets.
- Typing indicator support during active chats.
- Online/offline presence and last-seen status for selected friends.
- Friend discovery and add-friend request flow.
- Pending friend request list with in-app accept action.
- Search and filter friends in the conversation list.
- User profile page that displays authenticated user information.

## Tech Stack

- **Framework:** React 18
- **Routing:** React Router
- **UI Libraries:** MDB React UI Kit, Bootstrap
- **Styling:** CSS modules/files (with Tailwind/PostCSS dependencies available)
- **Realtime Communication:** Native WebSocket API
- **HTTP/API calls:** Fetch API with credentialed CORS requests
- **Build Tooling:** Create React App (`react-scripts`)
- **Testing:** React Testing Library + Jest DOM

## Project Structure

- `src/pages/Login.js` – Google sign-in screen
- `src/components/Chatscreen/index.js` – main chat UI, messaging, presence, and friend workflows
- `src/pages/Profile.jsx` – authenticated user profile view
- `src/App.js` – top-level routes and app entry flow

## Available Scripts

In the `frontend` directory, you can run:

### `npm start`
Starts the app in development mode on `http://localhost:3000`.

### `npm test`
Runs the test suite in watch mode.

### `npm run build`
Builds the production-ready app in the `build` folder.

### `npm run eject`
Ejects Create React App configuration (one-way operation).

## Environment Variable

Create a `.env` file in the `frontend` directory and set:

```bash
REACT_APP_BASE_URL=http://<your-backend-host>
```

This value is used for REST API and WebSocket backend endpoints.
