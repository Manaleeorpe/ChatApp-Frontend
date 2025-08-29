import React, { useState, useEffect, useCallback, useRef } from "react";
import "./index.css"; // CSS file for styling

const BASE_URL = process.env.REACT_APP_BASE_URL;

export default function Chatscreen() {
  const [currentUser, setCurrentUser] = useState({
    name: "",
    email_id: "",
    ID: null,
  });
  const [userFriends, setUserFriends] = useState([]);
  const [nonFriendUsers, setNonFriendUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState(null);
  const [isFriendOnline, setIsFriendOnline] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);

  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friendEmail, setFriendEmail] = useState("");

  const ws = useRef(null);

  const userId = currentUser.ID;
  const friendId = selectedFriend?.ID;

  // Log whenever userId or friendId changes
  useEffect(() => {
    console.log("[Chatscreen] userId:", userId, "friendId:", friendId);
  }, [userId, friendId]);

  const fetchMessages = useCallback(async () => {
    if (!userId || !friendId) return;

    try {
      console.log("[FetchMessages] GET", `${BASE_URL}/messages/${userId}/${friendId}`);
      const res = await fetch(`${BASE_URL}/messages/${userId}/${friendId}`, {
        credentials: "include",
        mode: "cors",
      });

      if (res.status === 404) {
        setMessages([]);
        return;
      }

      if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
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
        setMessages(data.map((m) => ({ text: m.Content, from: m.SenderName })));
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
        const url = `${BASE_URL}/ws/isOnline/${friendId}`;
        console.log("[OnlineStatus] GET", url);
        const res = await fetch(url, { credentials: "include", mode: "cors" });
        if (res.ok) {
          const { online } = await res.json();
          setIsFriendOnline(Boolean(online));
        } else {
          setIsFriendOnline(false);
        }
      } catch (e) {
        console.error("Error checking online status:", e);
        setIsFriendOnline(false);
      }
    };

    checkOnlineStatus();
  }, [friendId]);

  useEffect(() => {
    if (!userId || !friendId || !isFriendOnline) return;

    if (ws.current) {
      console.log("[WS] Cleanup previous socket before opening new", {
        prevReadyState: ws.current.readyState,
      });
      ws.current.close();
    }

    const wsHost = BASE_URL.replace(/^https?:\/\//, "");
    const wsUrl = `wss://${wsHost}/ws/${userId}/${friendId}`;
    console.log("[WS] Opening WebSocket:", wsUrl, {
      userId,
      friendId,
      isFriendOnline,
    });

    const socket = new WebSocket(wsUrl);
    ws.current = socket;

    socket.onopen = () => {
      console.log(`[WS] Connected. userId=${userId}, friendId=${friendId}`);
    };

    socket.onmessage = (event) => {
      console.log("[WS] Message:", event.data, { userId, friendId });
      try {
        const message = JSON.parse(event.data);
        if (message.Content && message.SenderName) {
          setMessages((prev) => [
            ...prev,
            { text: message.Content, from: message.SenderName },
          ]);
          return;
        }
      } catch {
        // Not JSON, treat as plain string
      }
      setMessages((prev) => [
        ...prev,
        { text: event.data, from: selectedFriend?.name || "Unknown" },
      ]);
    };

    socket.onerror = (err) => {
      console.error("[WS] Error:", err, { userId, friendId });
    };

    socket.onclose = (ev) => {
      console.log("[WS] Closed:", {
        code: ev.code,
        reason: ev.reason,
        wasClean: ev.wasClean,
        userId,
        friendId,
      });
    };

    return () => {
      console.log("[WS] Cleanup (closing socket)", { userId, friendId });
      socket.close();
    };
  }, [userId, friendId, isFriendOnline, selectedFriend]);

  useEffect(() => {
    async function fetchUser() {
      try {
        const url = `${BASE_URL}/users/me`;
        console.log("[FetchUser] GET", url);
        const res = await fetch(url, {
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
      const url = `${BASE_URL}/friends/friendRequestStatus/${userId}/Accepted`;
      console.log("[FetchFriends] GET", url);
      const res = await fetch(url, {
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
      setUserFriends(Array.isArray(data) ? data : []);
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
        const url = `${BASE_URL}/friends/friendRequestUserCanAccept/${userId}`;
        console.log("[PendingRequests] GET", url);
        const res = await fetch(url, {
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
        const url = `${BASE_URL}/users/suggestedfriends/${userId}`;
        console.log("[NonFriends] GET", url);
        const res = await fetch(url, {
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

  const filteredFriends = userFriends.filter((f) =>
    (f.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const sendMessage = () => {
    const text = messageText.trim();
    console.log("[Send]", {
      text,
      userId,
      friendId,
      wsReady: ws.current?.readyState,
    });
    if (
      !text ||
      !selectedFriend ||
      !userId ||
      !ws.current ||
      ws.current.readyState !== WebSocket.OPEN
    )
      return;

    setMessages((prev) => [...prev, { from: currentUser.name, text }]);
    setMessageText("");

    try {
      ws.current.send(text);
    } catch (e) {
      console.error("❌ Error sending WebSocket message:", e, {
        userId,
        friendId,
      });
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
      const url = `${BASE_URL}/users/email/${email}`;
      console.log("[LookupByEmail] GET", url);
      const res = await fetch(url, {
        credentials: "include",
        mode: "cors",
      });
      if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
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
      const url = `${BASE_URL}/friends`;
      console.log("[SendFriendRequest] POST", url, {
        Friend1UserID: userId,
        Friend2UserID: friendRequestID,
      });
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Friend1UserID: userId,
          Friend2UserID: friendRequestID,
        }),
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
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
      const url = `${BASE_URL}/friends/${userId}/${request.ID}/Accepted`;
      console.log("[AcceptRequest] PUT", url);
      const res = await fetch(url, {
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
      setPendingRequests((prev) => prev.filter((r) => r.ID !== request.ID));
      fetchFriends();
    } catch (e) {
      console.error("❌ Error accepting friend request:", e);
      alert("Network error while accepting friend request.");
    }
  };

  if (loadingUser) return <div>Loading user...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="chat-container">
      {showAddFriendModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddFriendModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add a Friend</h3>
            <select
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
            >
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
              <button onClick={() => setShowAddFriendModal(false)}>
                Cancel
              </button>
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

        <button
          className="add-friend-button"
          onClick={() => setShowAddFriendModal(true)}
        >
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
                  console.log("[UI] Selected friend:", f);
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
          {selectedFriend
            ? `Chat with ${selectedFriend.email_id}`
            : "Select a friend to start chatting"}
        </div>

        <div className="message-container">
          {messages.length === 0 ? (
            <div className="no-messages">No messages</div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`message ${
                  msg.from === currentUser.name ? "me" : "other"
                }`}
              >
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
          <button
            className="send-button"
            onClick={sendMessage}
            disabled={!selectedFriend}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
