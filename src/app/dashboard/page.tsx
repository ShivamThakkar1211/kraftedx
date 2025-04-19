'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import styles from './dashboard.module.css'; // Make sure to create a CSS file

const DashboardPage = () => {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <p className={styles.loadingText}>Loading...</p>;
  }

  const user = session?.user;

  return (
    <div className={styles.dashboardContainer}>
      <h1 className={styles.heading}>Dashboard</h1>

      {user ? (
        <div className={styles.userInfo}>
          <p><strong>Username:</strong> {user.username || 'N/A'}</p>
          <p><strong>Email:</strong> {user.email}</p>
          {user.image && (
            <img
              src={user.image}
              alt="Profile"
              className={styles.profileImage}
            />
          )}
        </div>
      ) : (
        <p>No user session found.</p>
      )}
    </div>
  );
};

export default DashboardPage;
