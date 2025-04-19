import React from 'react'
import styles from "./hero.module.css"
import Link from 'next/link'
const Hero = () => {
  return (
    
    <p className={styles.hollowText}><Link href="/sign-up" className={styles.link}>Login</Link> to get your personalized dashboard</p>

  )
}

export default Hero