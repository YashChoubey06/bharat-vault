"use client";

import React from "react";
import styles from "./StatCard.module.css";

export default function StatCard({
  category = "CATEGORY",
  value = "0",
  subtext,
  icon: Icon,
  trend,
  trendTone = "emerald", // "emerald", "rose", "amber"
  categoryTone = "blue", // "blue", "emerald", "amber", "rose"
}) {
  return (
    <article className={styles.statCard}>
      <div className={styles.cardTop}>
        <span className={styles.categoryLabel}>{category}</span>

        {trend && (
          <span className={`${styles.trendBadge} ${styles[trendTone]}`}>
            {trend}
          </span>
        )}
      </div>

      <div className={styles.cardBottom}>
        <div className={styles.valueGroup}>
          <span className={styles.value}>{value}</span>
          {subtext && <span className={styles.subtext}>{subtext}</span>}
        </div>

        {Icon && (
          <div className={`${styles.iconPill} ${styles[categoryTone]}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </article>
  );
}
