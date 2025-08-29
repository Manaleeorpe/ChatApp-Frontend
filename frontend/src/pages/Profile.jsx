import React, { useEffect, useState } from 'react';

const BASE_URL = process.env.REACT_APP_BASE_URL;

function Profile() {
  const [currentUser, setCurrentUser] = useState({ name: '', email_id: '', ID: null });
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState(null);

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
        setError(e.message);
      } finally {
        setLoadingUser(false);
      }
    }
    fetchUser();
  }, []);

  if (loadingUser) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Your Profile</h1>
      <p>Name: {currentUser.name}</p>
      <p>email_id: {currentUser.email_id}</p>
      <p>ID: {currentUser.ID}</p>
    </div>
  );
}

export default Profile;