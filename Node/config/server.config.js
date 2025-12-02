
// 引入 dotenv 來讀取 .env 檔案中的環境變數 (如果你的金鑰是放在 .env)
import 'dotenv/config.js'; // 如果 Channel ID/Secret Key 放在 .env 才需要

export const serverConfig = {
  linePay: {
    development: {
      channelId: '2007480268',
      channelSecret: '701a5f803f12b83a8cfe73314d50350e',
      confirmUrl: 'http://localhost:3001/api/line-pay', // 後端確認網址 (如果需要)
        cancelUrl: 'http://localhost:3001/line-pay/cancel', // 前端取消網址
    },
    production: {
        channelId: '2007480268',
        channelSecret: '701a5f803f12b83a8cfe73314d50350e',
        confirmUrl: 'https://next-app-raw.vercel.app/line-pay',
      cancelUrl: 'https://next-app-raw.vercel.app/line-pay/cancel',
    }
  },
  // 你可能還有其他的伺服器設定...
  port: process.env.PORT || 3001,
};