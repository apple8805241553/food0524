'use client'

import React from 'react'
import styles from '../styles/FAQ.module.css'
import Link from 'next/link'
import RecipeQA from '../components/RecipeQA'

const FAQPage = () => {
  return (
    <div className={styles.pageWrapper}>
      {/* Navigation Bar */}
      {/* <div className={styles.navbar}>
        <div className={styles.navInner}>
          <div className={styles.navLeftGroup}>
            <img
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/147ffededb40ea0e14bf97b005d572350cf667e7?placeholderIfAbsent=true"
              className={styles.logoImage}
              alt="Logo"
            />
            <div className={styles.navBtnGroup}>
              <div className={styles.navBtn}>美味食譜</div>
              <div className={styles.navBtn}>食材商城</div>
              <div className={styles.navBtn}>我的收藏</div>
              <div className={styles.navBtn}>客服中心</div>
            </div>
          </div>
          <div className={styles.navRightGroup}>
            <div className={styles.searchBar} />
            <img
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/3b4106d2d7a7ff195be9319db4cefb439b3a1618?placeholderIfAbsent=true"
              className={`${styles.navIcon} ${styles.cartIcon}`}
              alt="Cart"
            />
            <img
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/a4c69ecdb397ef30ee07fb46eb98010b30a24aa1?placeholderIfAbsent=true"
              className={`${styles.navIcon} ${styles.userIcon}`}
              alt="User"
            />
          </div>
        </div>
      </div> */}

      {/* Introduction Section */}
      <div className={styles.section}>
        <div className={styles.avatar} />
        <div className={styles.container}>
          <div className={styles.title}>���見問題解答</div>
          <div className={styles.description}>
            以下整理了食譜、商城與客服相關問題解答，希望能幫到您！
          </div>
        </div>
        <div className={styles.decorationWrapper}>
          <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/5b287091c93b72998cd9d690c685f4e6dc8c394d?placeholderIfAbsent=true"
            className={styles.decorationImage}
            alt="Decoration"
          />
        </div>
      </div>

      {/* Recipe FAQ Section */}
      <RecipeQA />
      <img
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/caf83b322219a39da560bff8ee087341b0455a06?placeholderIfAbsent=true"
        className={styles.bottomDecoration}
        alt="Decoration"
      />

      {/* Shop FAQ Section */}
      <div className={styles.contentsSection}>
        <div className={styles.shopTitle}>商城相關</div>
        <div className={styles.shopList}>
          <div className={styles.shopRow}>
            <div className={styles.article}>
              <div className={styles.imageContainer}>
                <div className={styles.image} />
              </div>
              <div className={styles.articleContent}>
                <div className={styles.articleTitle}>如何下單？</div>
                <div className={styles.articleSubtitle}>
                  您可以瀏覽商城，選擇喜愛的商品加入購物車，完成結帳即可。
                </div>
              </div>
            </div>
            <div className={styles.article}>
              <div className={styles.imageContainer}>
                <div className={styles.image} />
              </div>
              <div className={styles.articleContent}>
                <div className={styles.robotoTitle}>
                  <span
                    style={{
                      fontFamily:
                        'Inter, -apple-system, Roboto, Helvetica, sans-serif',
                      fontWeight: '400',
                      lineHeight: '24px',
                      letterSpacing: '0.6px',
                    }}
                  >
                    有哪些付款方式
                  </span>
                  ？
                </div>
                <div className={styles.articleSubtitle}>
                  我們支援信用卡、Apple Pay、Google Pay等多種付款方式。
                </div>
              </div>
            </div>
          </div>
          <div className={styles.shopRow}>
            <div className={styles.article}>
              <div className={styles.imageContainer}>
                <div className={styles.image} />
              </div>
              <div className={styles.articleContent}>
                <div className={styles.robotoTitle}>訂單多久會出貨？</div>
                <div className={styles.articleSubtitle}>
                  出貨時間一般為付款後1-3工作天，請留意商品種類與物流狀況。
                </div>
              </div>
            </div>
            <div className={styles.article}>
              <div className={styles.imageContainer}>
                <div className={styles.image} />
              </div>
              <div className={styles.articleContent}>
                <div className={styles.articleTitle}>如何查詢訂單狀態？</div>
                <div className={styles.articleSubtitle}>
                  您可以登入會員中心，進入訂單查詢即可查看最新訂單狀態。
                </div>
              </div>
            </div>
          </div>
          <div className={styles.shopRow}>
            <div className={`${styles.article} ${styles.fullWidth}`}>
              <div className={styles.imageContainer}>
                <div className={styles.image} />
              </div>
              <div className={styles.articleContent}>
                <div className={styles.articleTitle}>是否提供海外配送？</div>
                <div className={styles.articleSubtitle}>
                  我們配送範圍僅限特定國家，需海外配送請聯繫客服。
                </div>
              </div>
            </div>
          </div>
        </div>
        <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/caf83b322219a39da560bff8ee087341b0455a06?placeholderIfAbsent=true"
          className={styles.bottomDecoration}
          alt="Decoration"
        />
        <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/e74a05b195c802f9972a4ba60376a438be0322fc?placeholderIfAbsent=true"
          className={styles.rightDecoration}
          alt="Decoration"
        />
      </div>

      {/* Customer Service Section */}
      <div className={styles.serviceSection}>
        <div className={styles.serviceTitle}>退換貨與客服</div>
        <div className={styles.serviceList}>
          <div className={styles.serviceRow}>
            <div className={styles.serviceItem}>
              <div className={styles.serviceIcon}>🛍️</div>
              <div className={styles.serviceContent}>
                <div className={styles.serviceItemTitle}>
                  收到商品有問題怎麼辦？
                </div>
                <div className={styles.serviceItemDescription}>
                  若商品有損壞或與訂單不符，
                  <br />
                  請在收到商品後 7 天內聯繫客服，
                  <br />
                  我們會協助您處理退換貨事宜。
                </div>
              </div>
            </div>
            <div className={styles.serviceItem}>
              <div className={styles.serviceIcon}>📞</div>
              <div className={styles.serviceContent}>
                <div className={styles.serviceItemTitle}>如何聯繫客服？</div>
                <div className={styles.serviceItemDescription}>
                  您可以透過 [Email/Line/網站客服系統] 聯繫我們，
                  <br />
                  服務時間為 [工作日時間]。
                </div>
              </div>
            </div>
          </div>
        </div>
        <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/caf83b322219a39da560bff8ee087341b0455a06?placeholderIfAbsent=true"
          className={styles.bottomDecoration}
          alt="Decoration"
        />
      </div>

      {/* Contact Information Section */}
      <div className={styles.contactSection}>
        <div className={styles.contactContainer}>
          <div className={styles.contactBox}>
            如果您仍有疑問或需要協助，請隨時聯繫我們的客服團隊。
            <br />
            0800-001-677
            <br />
            【服務時間】 周一~周五09:00-18:00(國定假日除外)
            <br />
          </div>
        </div>
        <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/caf83b322219a39da560bff8ee087341b0455a06?placeholderIfAbsent=true"
          className={styles.bottomDecoration}
          alt="Decoration"
        />
        <div className={styles.leftDecoration}>
          <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/8b277e100c45273de183414ec985b3bb5af5cc86?placeholderIfAbsent=true"
            className={styles.leftDecorationImage}
            alt="Decoration"
          />
        </div>
      </div>

      {/* Footer Section */}
      {/* <div className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.leftSection}>
            <div className={styles.thankYouMessage}>
              謝謝您來逛逛我們的網站！有您的瀏覽，我們超開心 🎉
            </div>
            <div className={styles.formFeedback}>
              <div className={styles.feedbackText}>
                如果您願意也歡迎留下回饋，讓我們變得更棒、更貼近您的期待！
              </div>
              <div className={styles.feedbackInput}>
                請留下您寶貴的意見，讓我們變得更好唷~
              </div>
            </div>
          </div>
          <div className={styles.rightSection}>
            <Link href="/faq">
              <div className={styles.faqButton}>常見問題</div>
            </Link>
            <div className={styles.socialIcons}>
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/464e6eb905bdf715152a7e00c64be57539f55b59?placeholderIfAbsent=true"
                className={styles.socialIcon}
                alt="Social Icon"
              />
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/a61db9386eb9dc99e109ec3527ebe934ec06f640?placeholderIfAbsent=true"
                className={styles.socialIcon}
                alt="Social Icon"
              />
              <div className={styles.iconPlaceholder}>
                <div className={styles.placeholderCircle}></div>
              </div>
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/dfde8bc530d3c12eafe8ebcc1a47e3b5d5391a93?placeholderIfAbsent=true"
                className={styles.socialIcon}
                alt="Social Icon"
              />
            </div>
          </div>
        </div>
      </div> */}
    </div>
  )
}

export default FAQPage
