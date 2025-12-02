// 本資料夾只是拿來示範 useEffect 的用法
// 如果對useEffect不熟的可以加減參考
// useEffect簡單來說就是當改變了某個狀態時，就會啟動裡面的函數
'use client'
import React, { useState, useEffect } from 'react'

function BackgroundColorChanger() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    // 定義顏色
    const colors = [
      '#f28b82',
      '#fbbc04',
      '#fff475',
      '#ccff90',
      '#a7ffeb',
      '#cbf0f8',
      '#aecbfa',
      '#d7aefb',
    ]

    // 取 count 對應的顏色（用 % 確保不會超出陣列長度）
    const color = colors[count % colors.length]

    // 改變背景色
    document.body.style.backgroundColor = color

    // 可選：回傳清除函數（元件卸載時還原背景色）
    return () => {
      document.body.style.backgroundColor = ''
    }
  }, [count]) // count 一變就會重新執行這個 effect

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>按按鈕改背景色 🎨</h1>
      <p>目前 count：{count}</p>
      <button onClick={() => setCount(count + 1)}>點我</button>
    </div>
  )
}

export default BackgroundColorChanger
