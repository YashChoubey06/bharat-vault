"use client";

import { FileSpreadsheet, Map, Link2, Landmark, Scale, Info, ShieldCheck } from "lucide-react";
import styles from "./DilrmpProgressCard.module.css";

export default function DilrmpProgressCard({ progressData, scopeLabel }) {
  const data = progressData || {
    ror_digitized_percent: 94,
    cadastral_digitized_percent: 87,
    ror_map_linked_percent: 78,
    registration_integrated_percent: 81,
    court_integration_percent: 64,
    last_updated: "2026-09-20",
    source_status: "SIMULATED DATA",
  };

  const metrics = [
    {
      key: "ror",
      label: "RoR Computerization",
      description: "Textual record of rights digitization",
      percent: data.ror_digitized_percent,
      icon: FileSpreadsheet,
    },
    {
      key: "map",
      label: "Cadastral Map Digitization",
      description: "Geo-referenced village parcel boundaries",
      percent: data.cadastral_digitized_percent,
      icon: Map,
    },
    {
      key: "linkage",
      label: "RoR ↔ Map Linkage",
      description: "Spatial-textual cross-linkage ratio",
      percent: data.ror_map_linked_percent,
      icon: Link2,
    },
    {
      key: "reg",
      label: "Registration Integration",
      description: "Deed registry auto-sync status",
      percent: data.registration_integrated_percent,
      icon: Landmark,
    },
    {
      key: "court",
      label: "Revenue Court Integration",
      description: "Litigation case sync status",
      percent: data.court_integration_percent,
      icon: Scale,
    },
  ];

  return (
    <div className={styles.cardContainer}>
      <div className={styles.cardHeader}>
        <div className={styles.titleGroup}>
          <div className={styles.eyebrowRow}>
            <ShieldCheck size={13} />
            <span>DILRMP Alignment Dimension</span>
          </div>
          <h2 className={styles.cardTitle}>Digitization & Integration Progress</h2>
          <p className={styles.cardSubtitle}>
            Land record modernization indicators for {scopeLabel || "All India"}
          </p>
        </div>

        <div className={styles.sourceBadge} title="Values are simulated for demonstration purposes">
          <Info size={12} />
          <span>{data.source_status || "SIMULATED DATA"}</span>
        </div>
      </div>

      <div className={styles.progressList}>
        {metrics.map((item) => {
          const IconComp = item.icon;
          const val = typeof item.percent === "number" ? item.percent : 0;

          return (
            <div key={item.key} className={styles.progressRow}>
              <div className={styles.progressMeta}>
                <div className={styles.labelGroup}>
                  <IconComp size={14} className={styles.itemIcon} />
                  <span>{item.label}</span>
                </div>
                <span className={styles.percentValue}>{val}%</span>
              </div>

              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ width: `${Math.min(100, Math.max(0, val))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.footerNote}>
          <span>Last Updated: {data.last_updated || "2026-09-20"}</span>
        </div>
        <span>Source Status: {data.source_status || "SIMULATED DATA"}</span>
      </div>
    </div>
  );
}
