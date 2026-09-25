"use client";

import React from "react";
import styles from "./StatCard.module.css";

export default function StatCard({
  label,           // Replaces category
  category,        // Legacy support
  value,
  subtext,
  icon: Icon,
  trend,           // Legacy support, maps to subtext if subtext is absent
  variant = "neutral", // "neutral", "success", "warning", "critical"
  categoryTone,    // Legacy support, mapped to variant
  onClick,         // Actionable card
}) {
  // Map legacy props for backward compatibility
  const finalLabel = label || category || "Metric";
  const finalSubtext = subtext || trend;
  
  // Decide active variant. Legacy categoryTone overrides variant if provided
  let activeVariant = variant;
  if (categoryTone === "emerald") activeVariant = "success";
  else if (categoryTone === "amber") activeVariant = "warning";
  else if (categoryTone === "rose") activeVariant = "critical";
  else if (categoryTone === "blue") activeVariant = "neutral";

  return (
    <article
      className={`${styles.statCard} ${styles[activeVariant]} ${onClick ? styles.actionable : ""}`}
      onClick={onClick}
      role={onClick ? "button" : "article"}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={styles.cardHeader}>
        {Icon && (
          <div className={styles.iconWrapper}>
            <Icon size={16} />
          </div>
        )}
        <span className={styles.label}>{finalLabel}</span>
      </div>

      <div className={styles.valueGroup}>
        <strong className={styles.value}>{value}</strong>
      </div>

      {finalSubtext && (
        <div className={styles.footer}>
          <span className={styles.subtext}>{finalSubtext}</span>
        </div>
      )}
    </article>
  );
}
