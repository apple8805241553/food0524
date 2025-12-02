'use client'
import { motion, AnimatePresence } from 'framer-motion'
import React from 'react'

export default function LoadingComponent() {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.3, // 設定動畫持續時間
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.9)',
          zIndex: 9999,
        }}
      >
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '20px', fontSize: '18px' }}>載入中...</p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
