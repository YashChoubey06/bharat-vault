"use client";

import React from "react";
import styles from "./TabSwitcher.module.css";

export default function TabSwitcher({ tabs = [], activeTab, onChange }) {
  return (
    <div className={styles.tabContainer} role="tablist">
      {tabs.map((tab) => {
        const id = typeof tab === "object" ? tab.id : tab;
        const label = typeof tab === "object" ? tab.label : tab;
        const icon = typeof tab === "object" ? tab.icon : null;
        const isActive = activeTab === id;

        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            className={`${styles.tabButton} ${isActive ? styles.active : ""}`}
            onClick={() => onChange(id)}
          >
            {icon}
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
