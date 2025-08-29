import React, { useEffect, useState } from 'react';

const BASE_URL = process.env.REACT_APP_BASE_URL;

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if we have any cookies first
    console.log('All cookies:', document.cookie);
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      console.log('Fetching user data...');
      
      const response = await fetch(`${BASE_URL}/users/me`, {
        method: 'GET',
        credentials: 'include', // Include cookies
        mode: 'cors', // Explicitly set CORS mode
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Add any additional headers your backend expects
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('User data received:', data);
      
      setUser(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      {loading && <p>Loading user data...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {user ? (
        <div>
          <p>Welcome, {user.Name || user.name}</p>
          <p>Email: {user.email_id || user.email}</p>
        </div>
      ) : (
        !loading && <p>No user data available</p>
      )}
    </div>
  );
}

export default Dashboard;