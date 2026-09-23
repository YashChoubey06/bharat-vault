"use client";

import { Layers } from "lucide-react";
const defaultData = [];
import styles from "./EvidenceMatrix.module.css";

export default function EvidenceMatrix({ data = defaultData }) {
  const rows = data || [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.eyebrow}>CROSS-SOURCE INTELLIGENCE</span>
          <h2 className={styles.title}>
            <Layers size={20} style={{ color: "#2563eb" }} />
            Multi-Source Reconciliation (Evidence Matrix)
          </h2>
        </div>

        <span className={styles.uspTag}>CORE USP SCREEN</span>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.matrixTable}>
          <thead>
            <tr>
              <th>Field</th>
              <th>RoR</th>
              <th>Registration</th>
              <th>Mutation</th>
              <th>GIS</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {!rows.length && <tr><td colSpan={6}>Inspect source evidence for this parcel to compare extracted values.</td></tr>}
            {rows.map((row, idx) => {
              const isAreaConflict = row.status === "CONFLICT";

              return (
                <tr key={row.field || idx}>
                  <td className={styles.fieldCell}>{row.field}</td>
                  <td>{row.ror || "—"}</td>
                  <td>{row.registration || "—"}</td>
                  <td>{row.mutation || "—"}</td>

                  {/* Land Lens Soft Highlight animation for GIS 2.20 ha conflicting cell */}
                  <td className={isAreaConflict ? styles.conflictCell : row.gis === "—" ? styles.emptyCell : ""}>
                    {row.gis || "—"}
                  </td>

                  <td>
                    <span
                      className={
                        row.status === "CONFLICT"
                          ? styles.statusConflict
                          : styles.statusMatch
                      }
                    >
                      {row.statusLabel || (row.status === "CONFLICT" ? "⚠ Conflict" : "✓ Match")}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
