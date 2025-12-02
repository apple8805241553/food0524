"use client";

import React from "react";
import styles from "../styles/RecipeQA.module.css";

function RecipeQA() {
  return (
    <div className={styles.listContainer}>
      <div className={styles.titleContainer}>食譜相關</div>
      <div className={styles.qaRow}>
        <div className={styles.qaItem}>
          <div className={styles.iconFrame}>🍳</div>
          <div className={styles.contentBox}>
            <div className={styles.questionTitle}>如何搜尋特定食譜？</div>
            <div className={styles.answerText}>
              您可以使用網站上的搜尋功能，
              <br />
              輸入食材或料理名稱來找到相關食譜。
            </div>
          </div>
        </div>
        <div className={styles.qaItem}>
          <div className={styles.iconFrame}>🥘</div>
          <div className={styles.contentBox}>
            <div className={styles.questionTitle}>
              食譜是否提供詳細步驟和份量？
            </div>
            <div className={styles.answerText}>
              是的，每個食譜都有詳細的步驟、
              <br />
              所需食材和份量標示，讓您輕鬆烹飪。
            </div>
          </div>
        </div>
        <div className={styles.qaItem}>
          <div className={styles.iconFrame}>🌿</div>
          <div className={styles.contentBox}>
            <div className={styles.questionTitle}>是否提供替代食材建議？</div>
            <div className={styles.answerText}>
              部分食譜會提供替代食材建議，
              <br />
              您也可以在評論區詢問，
              <br />
              我們會盡量回覆您的問題。
            </div>
          </div>
        </div>
      </div>
      <div className={styles.spacer} />
    </div>
  );
}

export default RecipeQA;
