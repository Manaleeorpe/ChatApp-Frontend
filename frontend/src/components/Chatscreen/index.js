import React, { useState, useEffect, useCallback, useRef } from "react";
import "./index.css"; // CSS file for styling

const BASE_URL = process.env.REACT_APP_BASE_URL;

export default function Chatscreen() {
  const [currentUser, setCurrentUser] = useState({ name: "", email_id: "", ID: null });
  const [userFriends, setUserFriends] = useState([]);
  const [nonFriendUsers, setNonFriendUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState(null);
  const [friendStatus, setFriendStatus] = useState({
    online: false,
    last_seen: null,
  });


  const [search, setSearch] = useState("");
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);

  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friendEmail, setFriendEmail] = useState("");

  const ws = useRef(null);

  const userId = currentUser.ID;
  const friendId = selectedFriend?.ID;

  const fetchMessages = useCallback(async () => {
    if (!userId || !friendId) return;

    try {
      const res = await fetch(`${BASE_URL}/messages/${userId}/${friendId}`, {
        credentials: "include",
        mode: "cors",
      });

      if (res.status === 404) {
        setMessages([]);
        return;
      }

      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          alert(errorData.message || `Error: HTTP ${res.status}`);
        } else {
          const errorText = await res.text();
          alert(errorText || `Error: HTTP ${res.status}`);
        }
        return;
      }

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        setMessages([]);
      } else {
        setMessages(data.map(m => ({ text: m.Content, from: m.SenderName })));
      }
    } catch (e) {
      console.error("❌ Error fetching messages:", e);
      setError(e.message);
    }
  }, [userId, friendId]);

  useEffect(() => {
    if (!friendId) return;

    const checkOnlineStatus = async () => {
  try {
    const res = await fetch(`${BASE_URL}/ws/isOnline/${friendId}`, {
      credentials: "include", // Include cookies
      mode: "cors", // Ensure CORS mode is set
    });
    if (res.ok) {
      const data = await res.json(); 
      setFriendStatus({
      online: Boolean(data.online),
      last_seen: data.last_seen || null,
    });
    } else {
      setFriendStatus({
      online: false,
      last_seen:  null,
    });
    }
  } catch (e) {
    console.error("Error checking online status:", e);
    setFriendStatus({
      online: false,
      last_seen:  null,
    });
  }
    };
    

    checkOnlineStatus();
  }, [friendId]);

  useEffect(() => {
  if (!userId || !friendId) return;

  if (ws.current) {
    ws.current.close();
  }

  // Dynamically construct the WebSocket URL using BASE_URL
  const wsHost = BASE_URL.replace(/^https?:\/\//, ""); // Remove http:// or https://
  const wsUrl = `ws://${wsHost}/ws/${userId}/${friendId}`; // Use ws:// for local development
  console.log("[WebSocket URL]", wsUrl); // Log the WebSocket URL for debugging

  const socket = new WebSocket(wsUrl);
  ws.current = socket;

  socket.onopen = () => {
    console.log(`🔌 WebSocket connected to ${friendId}`);
  };

  socket.onmessage = (event) => {
    console.log("📥 Raw WebSocket message:", event.data);
    try {
      const message = JSON.parse(event.data);
      if (message.Content && message.SenderName) {
        setMessages((prev) => [...prev, { text: message.Content, from: message.SenderName }]);
        return;
      }
    } catch {
      // Not JSON, treat as plain string
      setMessages((prev) => [...prev, { text: event.data, from: selectedFriend?.name || "Unknown" }]);
    }
  };

  socket.onerror = (err) => {
    console.error("WebSocket error:", err);
  };

  socket.onclose = () => {
    console.log("🔌 WebSocket closed");
  };

  return () => {
    console.log("[WebSocket] Cleaning up connection");
    socket.close();
  };
  }, [userId, friendId, selectedFriend]);
  
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`${BASE_URL}/users/me`, {
          credentials: "include",
          mode: "cors",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setCurrentUser({ name: data.name, email_id: data.email_id, ID: data.ID });
      } catch (e) {
        console.error("❌ Error fetching user:", e);
        setError(e.message);
      } finally {
        setLoadingUser(false);
      }
    }
    fetchUser();
  }, []);

  const fetchFriends = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${BASE_URL}/friends/friendRequestStatus/${userId}/Accepted`, {
        credentials: "include",
        mode: "cors",
      });
      if (res.status === 404) {
        setUserFriends([]);
        return;
      }
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      const data = await res.json();
      setUserFriends(data);
    } catch (e) {
      console.error("❌ Error fetching friends:", e.message);
      setError(e.message);
    }
  }, [userId]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  useEffect(() => {
    if (!userId) return;
    async function fetchPendingRequests() {
      try {
        const res = await fetch(`${BASE_URL}/friends/friendRequestUserCanAccept/${userId}`, {
          credentials: "include",
          mode: "cors",
        });
        if (!res.ok) {
          setPendingRequests([]);
          return;
        }
        const data = await res.json();
        setPendingRequests(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error fetching pending friend requests:", e);
      }
    }
    fetchPendingRequests();
  }, [userId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!showAddFriendModal || !userId) return;
    async function fetchNonFriends() {
      try {
        const res = await fetch(`${BASE_URL}/users/suggestedfriends/${userId}`, {
          credentials: "include",
          mode: "cors",
        });
        const data = await res.json();
        setNonFriendUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error fetching non-friends:", e);
      }
    }
    fetchNonFriends();
  }, [showAddFriendModal, userId]);

  const filteredFriends = userFriends.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const sendMessage = () => {
    const text = messageText.trim();
    if (!text || !selectedFriend || !userId || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    setMessages(prev => [...prev, { from: currentUser.name, text }]);
    setMessageText("");

    try {
      ws.current.send(text);
    } catch (e) {
      console.error("❌ Error sending WebSocket message:", e);
      setError("Failed to send message over WebSocket");
    }
  };

  const sendFriendRequest = async () => {
    const email = (friendEmail || "").trim();
    if (!email || !userId) {
      alert("Email and user ID are required.");
      return;
    }

    let friendRequestID;

    try {
      const res = await fetch(`${BASE_URL}/users/email/${email}`, {
        credentials: "include",
        mode: "cors",
      });
      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          alert(errorData.message || `Error: HTTP ${res.status}`);
        } else {
          const errorText = await res.text();
          alert(errorText || `Error: HTTP ${res.status}`);
        }
        return;
      }
      const result = await res.json();
      friendRequestID = result.ID;
    } catch (e) {
      console.error("❌ Network error while looking up email:", e);
      alert("Something went wrong. Please try again.");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/friends`, {
        method: "POST",
        credentials: "include",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ Friend1UserID: userId, Friend2UserID: friendRequestID }),
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          alert(errorData.message || `Error: HTTP ${res.status}`);
        } else {
          const errorText = await res.text();
          alert(errorText || `Error: HTTP ${res.status}`);
        }
        return;
      }

      const result = await res.json();
      alert(result.message || "✅ Friend request sent!");
      setFriendEmail("");
      setShowAddFriendModal(false);
    } catch (e) {
      console.error("❌ Error sending friend request:", e);
      alert("Network error. Please try again.");
    }
  };

  const acceptRequest = async (request) => {
    try {
      const res = await fetch(`${BASE_URL}/friends/${userId}/${request.ID}/Accepted`, {
        method: "PUT",
        credentials: "include",
        mode: "cors",
      });
      if (!res.ok) {
        const errorText = await res.text();
        alert(`Failed to accept friend request: ${errorText}`);
        return;
      }
      alert(`Friend request accepted!`);
      setPendingRequests(prev => prev.filter(r => r.ID !== request.ID));
      fetchFriends();
    } catch (e) {
      console.error("❌ Error accepting friend request:", e);
      alert("Network error while accepting friend request.");
    }
  };

  function formatLastSeen(timestamp) {
  if (!timestamp) return "";

  const last = new Date(timestamp);
  const now = new Date();
  const diffMs = now - last;
  const mins = Math.floor(diffMs / 60000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minutes ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;

  const days = Math.floor(hrs / 24);
  return `${days} days ago`;
}


  if (loadingUser) return <div>Loading user...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="chat-container">
      {showAddFriendModal && (
        <div className="modal-overlay" onClick={() => setShowAddFriendModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add a Friend</h3>
            <select value={friendEmail} onChange={(e) => setFriendEmail(e.target.value)}>
              <option value="">Select a user</option>
              {Array.isArray(nonFriendUsers) &&
                nonFriendUsers.map((user) => (
                  <option key={user.ID} value={user.email_id}>
                    {user.name} ({user.email_id})
                  </option>
                ))}
            </select>
            <div className="modal-buttons">
              <button onClick={sendFriendRequest}>Send Request</button>
              <button onClick={() => setShowAddFriendModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="left-panel">
        <div className="profile-section">
          <div className="profile-avatar">{currentUser.name.charAt(0)}</div>
          <div className="profile-name">{currentUser.name}</div>
          <div className="profile-email">{currentUser.email_id}</div>
        </div>

        <input
          className="search-input"
          type="text"
          placeholder="Search friends..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button className="add-friend-button" onClick={() => setShowAddFriendModal(true)}>
          Add Friend
        </button>

        {pendingRequests.length > 0 && (
          <div className="pending-requests-section">
            <h4>Pending Friend Requests</h4>
            {pendingRequests.map((req) => (
              <div key={req.ID} className="pending-request-card">
                <span>{req.email_id || `User ID: ${req.ID}`}</span>
                <button onClick={() => acceptRequest(req)}>Accept</button>
              </div>
            ))}
          </div>
        )}

        <div className="user-list">
          {filteredFriends.length === 0 ? (
            <div className="no-friends">No friends found</div>
          ) : (
            filteredFriends.map((f) => (
              <div
                key={f.ID}
                className={`user-card ${friendId === f.ID ? "selected" : ""}`}
                onClick={() => {
                  setSelectedFriend(f);
                  setMessages([]);
                }}
              >
                {`${f.email_id} : ${f.ID}`}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="right-panel">
        <div className="chat-header">
        {selectedFriend ? (
          <>
            <div>{`Chat with ${selectedFriend.email_id}`}</div>
            <div className="status-text">
              {friendStatus.online ? (
                <span className="online">🟢 Online</span>
              ) : (
                <span className="offline">
                  Last seen{" "}
                  {friendStatus.last_seen
                    ? formatLastSeen(friendStatus.last_seen)
                    : "a long time ago"}
                </span>
              )}
            </div>
          </>
        ) : (
          "Select a friend to start chatting"
        )}
      </div>


        <div className="message-container">
          {messages.length === 0 ? (
            <div className="no-messages">No messages</div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`message ${msg.from === currentUser.name ? "me" : "other"}`}>
                {msg.from}: {msg.text}
              </div>
            ))
          )}
        </div>

        <div className="input-section">
          <input
            className="message-input"
            type="text"
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={!selectedFriend}
          />
          <button className="send-button" onClick={sendMessage} disabled={!selectedFriend}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}