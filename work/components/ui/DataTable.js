"use client";

import React from "react";
import styles from "./DataTable.module.css";

export function StatusBadge({ label, tone = "emerald" }) {
  return (
    <span className={`${styles.statusBadge} ${styles[tone]}`}>
      {label}
    </span>
  );
}

export function ProgressIndicator({ value = 0, tone = "indigo" }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={styles.progressTrack} title={`${clamped}%`}>
      <div
        className={`${styles.progressBar} ${styles[tone] || ""}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export default function DataTable({ columns = [], data = [], renderRow }) {
  return (
    <div className={styles.tableCard}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} style={col.style}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data && data.length > 0 ? (
              data.map((row, rowIdx) =>
                renderRow ? (
                  renderRow(row, rowIdx)
                ) : (
                  <tr key={rowIdx}>
                    {columns.map((col, colIdx) => (
                      <td key={colIdx}>{row[col.accessor]}</td>
                    ))}
                  </tr>
                )
              )
            ) : (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
