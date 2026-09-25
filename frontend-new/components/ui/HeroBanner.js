"use client";

import React from "react";
import styles from "./HeroBanner.module.css";

export default function HeroBanner({
  eyebrow = "LAND RECORD INTELLIGENCE",
  title = "Good Morning, Officer",
  subtitle = "Here's today's verification & evidence reconciliation overview",
  stats = [
    { label: "Surveillance Active", value: "24,582" },
    { label: "Record Health", value: "93%" },
  ],
}) {
  return (
    <div className={styles.heroBanner}>
      <div className={styles.radialOverlay} />

      <div className={styles.contentRow}>
        <div className={styles.textSection}>
          <div className={styles.eyebrowBadge}>
            <span className={styles.liveDot} />
            {eyebrow}
          </div>

          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        {stats && stats.length > 0 && (
          <div className={styles.statsBlurBox}>
            {stats.map((stat, idx) => (
              <React.Fragment key={stat.label}>
                {idx > 0 && <div className={styles.divider} />}
                <div className={styles.kpiItem}>
                  <span className={styles.kpiValue}>{stat.value}</span>
                  <span className={styles.kpiLabel}>{stat.label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
