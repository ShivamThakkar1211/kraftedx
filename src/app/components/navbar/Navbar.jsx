'use client'

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import styles from './nav.module.css';

function Navbar() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarContainer}>
        <a href="/" className={styles.brand}>
          Shivam Thakkar
        </a>
        {session ? (
          <>
            <span className={styles.welcomeText}>
              Welcome, {user.username || user.email}
            </span>
            <button onClick={() => signOut()} className={styles.navButton}>
              Logout
            </button>
          </>
        ) : (
          <Link href="/sign-in" className={styles.linkWrapper}>
            <button className={styles.navButton}>Login</button>
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
