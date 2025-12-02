import Link from 'next/link'
import styles from '../src/styles/page-styles/RestaurantDetail.module.scss'
import React from 'react'

export default function Bread({ items }) {
  return (
    <div className={styles.breadcrumbNav}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <div>/</div>}
          {item.href ? (
            <Link href={item.href}>{item.text}</Link>
          ) : (
            <div>{item.text}</div>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// 使用範例
// import Bread from '@/app/components/Bread'
// 在要使用麵包屑的地方
// 文字和連到的頁面改一下就可以了
{
  /* <Bread
        items={[
         { text: '首頁', href: '/' },
         { text: '餐廳列表', href: '/restaurants' },
         { text: '餐廳介紹' },
        ]}
    /> */
}
