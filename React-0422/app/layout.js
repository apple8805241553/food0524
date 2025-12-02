// 伺服器端元件很多Hook不能用，所以這個檔案才沒有指定成客戶端元件
// context套用第3步: 最上(外)層元件包裹提供者元件，讓祖先元件可以提供它
// 建立P(Provider)到C(Consumer)的階段結構

import Providers from './providers'
import Header from './components/Header'
import Footer from './components/Footer'
import './styles/globals.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import Script from 'next/script'
import './src/styles/main.scss' // 全域樣式
// 這邊要先註解，不然會報錯誤
// import './builder/builder-register'
// 05/18測試網頁進場動畫，
import PageTransition from './components/PageTransition'

// 因為這段程式碼會在伺服器端執行，所以不能使用 usePathname
// 也就是因為這段會擋到網頁轉場動畫，所以先註解調一下
export const metadata = {
  title: '美味食譜 - 您的烹飪好夥伴',
  description: '探索美味食譜、購買優質食材，讓烹飪變得更簡單',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body>
        <Script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.6/dist/js/bootstrap.bundle.min.js" />
        <Providers>
          <Header />
          {/* <PageTransition> */}
          <main>{children}</main>
          {/* </PageTransition> */}
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
