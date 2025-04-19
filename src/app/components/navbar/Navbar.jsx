'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import styles from './nav.module.css';

function Navbar() {
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarContainer}>
        <a href="/" className={styles.brand}>
          Shivam Thakkar
        </a>

        {status === 'loading' ? (
          <span className={styles.welcomeText}>Loading...</span>
        ) : session ? (
          <>
            <span className={styles.welcomeText}>
              Welcome, {user.username || user.email}
            </span>
            <Link href="/dashboard">
              <button className={styles.navButton}>Dashboard</button>
            </Link>

            <button onClick={() => signOut()} className={styles.navButton}>
              Logout
            </button>
          </>
        ) : (
          <button onClick={() => signIn('google')} className={styles.navButton}>
            Sign in with Google
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
