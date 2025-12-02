// 本資料夾的內容只是加減示範Childern屬性的功能
// 不熟該屬性的可以加減看看
// 想看實際畫面的話，也可以用npm run dev啟動之後，
// 到這個路徑位置看看結果

'use client'

import Children1 from './Children1'
import Children2 from './Children2'
import ChildrenIf from './ChildrenIf'
import ChildrenTest from './ChildrenTest'
import { useState } from 'react'

export default function StateForPropsPage() {
  const [count, setCount] = useState(0)
  const setCount2 = () => setCount(count + 1)

  return (
    <>
      <h1>傳遞狀態給子組件，{count}</h1>
      <Children1 count={count} setCount={setCount2} />
      <Children2 count={count} setCount={setCount2} />
      <hr />
      <ChildrenTest>
        <p>children傳遞是否成功</p>
      </ChildrenTest>
      {/* 條件渲染，或者可以說依照不同條件給ChildrenIf這個組件不同的內容 */}
      <ChildrenIf>
        {count >= 3 ? <p>目前大於3!</p> : <p>目前小於3</p>}
      </ChildrenIf>
    </>
  )
}
