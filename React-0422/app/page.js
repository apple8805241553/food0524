'use client'

import React from 'react'
import styles from './src/styles/page-styles/HomePage.module.scss'
import Link from 'next/link'
import Image from 'next/image'
import { TbHandFinger, PiHandTapBold, FaRegHandPointUp } from './icons/icons'
import SemicircleCarousel from './components/SemicircleCarousel'
import ProductCard from './components/ProductCard'
import RecipeCard from './components/RecipeCard'
import useSWR from 'swr'

export default function HomePage() {
  const fetcher = (url) => fetch(url).then((res) => res.json())

  // 獲取資料
  const { data: rankingData, error: rankingError } = useSWR(
    'http://localhost:3001/products/api/ranking',
    fetcher
  )
  // 從 API 回應中解構資料
  const rankingProducts = rankingData?.data?.products || []
  // 取得食譜
  const { data: recipesData, error: recipesError } = useSWR(
    'http://localhost:3001/recipes/api',
    fetcher
  )

  // 從 API 回應中解構食譜資料
  const recipes = recipesData?.rows || []
  // const isLoading = !data && !error
  // const products = data?.rows || {}
  // const recipes = recipesData?.rows || []
  // console.log(data)
  // const rankingProducts = rankingData?.rows || []
  console.log('rankingData:', rankingData)
  console.log('rankingProducts:', rankingProducts)
  return (
    <div className={styles.homePage}>
      <SemicircleCarousel />
      {/* <div className={styles.featuredSection}>
        <div className={styles.featuredGrid}>
          <div className={styles.featuredLarge}>
            <Image
              src="/images/featured-1.jpg"
              alt="Featured content"
              width={600}
              height={650}
              className={styles.featuredImage}
            />
            <div className={styles.imageOverlay}>
              <div className={styles.categoryTag}>生活</div>
              <div className={styles.imageTitle}>全新開幕，話題新餐廳!!</div>
            </div>
          </div>
          <div className={styles.featuredSmallContainer}>
            <div className={styles.featuredSmall}>
              <Image
                src="/images/featured-2.jpg"
                alt="Featured content"
                width={600}
                height={320}
                className={styles.featuredImage}
              />
              <div className={styles.imageOverlay}>
                <div className={styles.categoryTag}>健康</div>
                <div className={styles.imageTitle}>由水果所組成的健康吃法</div>
              </div>
            </div>
            <div className={styles.featuredSmall}>
              <Image
                src="/images/featured-3.jpg"
                alt="Featured content"
                width={600}
                height={320}
                className={styles.featuredImage}
              />
              <div className={styles.imageOverlay}>
                <div className={styles.categoryTag}>周末時光</div>
                <div className={styles.imageTitle}>
                  與朋友周末相聚時的好選擇!
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Shop Section */}
      <div className={styles.shopSection}>
        <div className={styles.sectionHeader}>
          <h2>食材商城</h2>
          <Link href="/products">
            More
            <TbHandFinger className={styles.TbHandFinger} />
          </Link>
        </div>

        {/* 錯誤處理 */}
        {rankingError && (
          <div className={styles.errorMessage}>無法載入排名資料</div>
        )}

        {/* 載入中狀態 */}
        {!rankingData && !rankingError && (
          <div className={styles.loadingSpinner}>載入中...</div>
        )}

        {/* 排名內容 */}
        {rankingData && (
          <div className={styles.topProductsSection}>
            {/* 前三名商品卡片 */}
            <div className={styles.topProductsShopCard}>
              {rankingProducts.slice(0, 3).map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  image={product.image_url || '/placeholder.jpg'}
                  brand={product.brand}
                  price={product.price}
                  original_price={product.original_price}
                  initialFavorite={false}
                />
              ))}
            </div>

            {/* 4-10名列表 */}
            <div className={styles.topProductsList}>
              {rankingProducts.slice(3, 10).map((product, index) => (
                <React.Fragment key={product.id}>
                  <div className={styles.productRankListItem}>
                    <Link href={`/products/${product.id}`}>
                      <p>{String(index + 4).padStart(2, '0')}</p>
                      <p>{product.name}</p>
                    </Link>
                  </div>
                  {index < 6 && <hr />}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 大廚上菜囉 */}
      {/* <div className={styles.contentSection}>
        <div className={styles.contentContainer}>
          <div className={styles.contentColumn}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>大廚上菜囉!</h2>
              <Link href="/recipes-landing" className={styles.moreLink}>
                More
              </Link>
            </div>

            <div className={styles.recipeItem}>
              <Image
                src="/images/recipe-1.jpg"
                alt="Recipe"
                width={600}
                height={225}
                className={styles.recipeImage}
              />
              <div className={styles.imageOverlay}>
                <div className={styles.categoryTag}>名廚上菜</div>
                <div className={styles.imageTitle}>
                  在家也能輕鬆做的四種冷麵
                </div>
              </div>
            </div>

            <div className={styles.recipeItem}>
              <Image
                src="/images/recipe-2.jpg"
                alt="Recipe"
                width={600}
                height={225}
                className={styles.recipeImage}
              />
              <div className={styles.imageOverlay}>
                <div className={styles.categoryTag}>名廚上菜</div>
                <div className={styles.imageTitle}>牛肉西吃的三種吃法</div>
              </div>
            </div>

            <div className={styles.recipeItem}>
              <Image
                src="/images/recipe-3.jpg"
                alt="Recipe"
                width={600}
                height={225}
                className={styles.recipeImage}
              />
              <div className={styles.imageOverlay}>
                <div className={styles.categoryTag}>名廚上菜</div>
                <div className={styles.imageTitle}>炭烤牛肋排</div>
              </div>
            </div>
          </div>

          <div className={styles.contentColumn}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>生活專區</h2>
              <Link href="/lifestyle" className={styles.moreLink}>
                More
              </Link>
            </div>

            <div className={styles.recipeItem}>
              <Image
                src="/images/lifestyle-1.jpg"
                alt="Lifestyle"
                width={600}
                height={225}
                className={styles.recipeImage}
              />
              <div className={styles.imageOverlay}>
                <div className={styles.categoryTag}>生活</div>
                <div className={styles.imageTitle}>全新開幕的話題蛋糕店!!</div>
              </div>
            </div>

            <div className={styles.recipeItem}>
              <Image
                src="/images/lifestyle-2.jpg"
                alt="Lifestyle"
                width={600}
                height={225}
                className={styles.recipeImage}
              />
              <div className={styles.imageOverlay}>
                <div className={styles.categoryTag}>生活</div>
                <div className={styles.imageTitle}>草莓季來襲</div>
              </div>
            </div>

            <div className={styles.recipeItem}>
              <Image
                src="/images/lifestyle-3.jpg"
                alt="Lifestyle"
                width={600}
                height={225}
                className={styles.recipeImage}
              />
              <div className={styles.imageOverlay}>
                <div className={styles.categoryTag}>生活</div>
                <div className={styles.imageTitle}>清爽夏海宴席</div>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      {/* 美味食譜 */}
      <div className={styles.shopSectionBG}>
        <div className={styles.recipeSection}>
          <div className={styles.recipeHeader}>
            {/* <h2>美味食譜</h2> */}
            <Link href="/recipes-landing/list">
              More
              <TbHandFinger className={styles.TbHandFinger} />
            </Link>
          </div>

          <div className={styles.recipeGrid}>
            {recipes.slice(0, 4).map((recipe) => (
              <RecipeCard
                key={recipe.id}
                id={recipe.id}
                title={recipe.title}
                description={recipe.description}
                image={recipe.image || '/placeholder.jpg'}
                initialFavorite={false}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
