'use client'

import React from 'react'
import styles from '../styles/profile-content.module.scss'
import { MdFavorite } from 'react-icons/md'
import { FaLock, FaUser } from 'react-icons/fa'
import { IoIosListBox } from 'react-icons/io'

const Sidebar = ({ activeContent, setActiveContent }) => {
  const handleClick = content => {
    setActiveContent(content)
  }

  const menuItems = [
    {
      key: 'profile',
      icon: <FaUser />, 
      text: '會員資料',
      path: '/member-center/profile',
    },
    {
      key: 'password',
      icon: <FaLock />,
      text: '修改密碼',
      path: '/member-center/password',
    },
    {
      key: 'favorites',
      icon: <MdFavorite />,
      text: '我的收藏',
      path: '/member-center/favorites',
    },
    {
      key: 'orders',
      icon: <IoIosListBox />,
      text: '我的訂單',
      path: '/member-center/orders',
    },
  ]

  return (
    <div className={styles.sidebar}>
      {menuItems.map((item, index) => (
        <div
          key={item.key}
          className={`${styles.sidebarButton} ${activeContent === item.key ? styles.active : ''}`}
          onClick={() => handleClick(item.key)}
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleClick(item.key)
            }
          }}
        >
          <div className={styles.buttonIcon}>{item.icon}</div>
          <div className={styles.buttonText}>{item.text}</div>
        </div>
      ))}
    </div>
  )
}

export default Sidebar
