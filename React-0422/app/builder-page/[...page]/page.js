// app/builder-page/[...page]/page.js
import { BuilderComponent, builder } from '@builder.io/react'
import { notFound } from 'next/navigation'

builder.init('bc51e869bc5c41c8821038acae859106') // <<< 換成你的 Builder 公開金鑰

export async function generateStaticParams() {
  return [] // 可留空，或填入常用頁面來做 pre-render
}

export default async function Page({ params }) {
  const urlPath = '/' + (params.page?.join('/') || '')
  const content = await builder
    .get('page', { userAttributes: { urlPath } })
    .toPromise()

  if (!content) {
    notFound()
  }

  return <BuilderComponent model="page" content={content} />
}
