'use client'

import React from 'react'
import styles from '../src/styles/Footer.module.scss'
import Link from 'next/link'
import { FaFacebook, FaInstagram, FaYoutube, FaXTwitter } from '../icons/icons'

const Footer = () => {
  return (
    <div className={styles.footer}>
      <div className={styles.footerContent}>
        <span>
          <h3>謝謝您來逛逛我們的網站！有您的瀏覽，我們超開心 🎉</h3>
          <p>如果您願意也歡迎留下回饋，讓我們變得更棒、更貼近您的期待！</p>
          <div>
            <textarea
              type="text"
              placeholder="請留下您寶貴的意見，讓我們變得更好唷~"
            />
          </div>
        </span>
        <span>
          <div>
            <button>
              <Link href="/contact">
                <h3>常見問題</h3>
              </Link>
            </button>
          </div>

          <div>
            <button>
              <FaFacebook />
            </button>
            <button>
              <FaInstagram />
            </button>
            <button>
              <FaXTwitter />
            </button>
            <button>
              <FaYoutube />
            </button>
          </div>
        </span>
      </div>
    </div>
  )
}

export default Footer
