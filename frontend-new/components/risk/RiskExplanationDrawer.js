"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { X, AlertOctagon, ChevronRight, ShieldAlert } from "lucide-react";
const defaultRiskExplanation = { factors: [], riskScore: 0 };
import styles from "./RiskExplanationDrawer.module.css";

export default function RiskExplanationDrawer({
  isOpen = false,
  onClose,
  data = defaultRiskExplanation,
  parcelId = "PRC-001",
}) {
  const router = useRouter();


  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const riskData = data || defaultRiskExplanation;
  const factors = riskData.factors || defaultRiskExplanation.factors;
  const overallRisk = riskData.overallRisk ?? riskData.riskScore ?? 0;
  const maxScore = riskData.maxScore || 100;
  const totalPoints = riskData.total || overallRisk;
  const recommendationText =
    riskData.recommendation ||
    "Prioritize this record for officer investigation.";

  function handleOpenInvestigation() {
    if (onClose) onClose();
    router.push("/verification");
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.drawer}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="risk-drawer-title"
      >
        {/* Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.drawerTitleGroup}>
            <span className={styles.drawerEyebrow}>EVIDENCE ANALYSIS</span>
            <h2 id="risk-drawer-title" className={styles.drawerTitle}>
              <ShieldAlert size={22} style={{ color: "#dc2626" }} />
              Risk Assessment
            </h2>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close risk explanation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.drawerBody}>
          {/* Overall Risk Card */}
          <div className={styles.scoreCard}>
            <div className={styles.scoreMeta}>
              <span className={styles.scoreLabel}>Overall Risk</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span className={styles.scoreValue}>{overallRisk}</span>
                <span className={styles.scoreMax}>/ {maxScore}</span>
              </div>
            </div>

            <span className={styles.riskBadge}>High Risk</span>
          </div>

          {/* Risk Factors Table */}
          <div className={styles.sectionBlock}>
            <span className={styles.sectionHeading}>Risk Factors</span>

            <div className={styles.factorsList}>
              {factors.map((factor, idx) => (
                <div key={idx} className={styles.factorItem}>
                  <span className={styles.factorName}>
                    {factor.name || factor.factor}
                  </span>
                  <span className={styles.factorPoints}>
                    {factor.points ?? factor.impact}
                  </span>
                </div>
              ))}

              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total</span>
                <span className={styles.totalVal}>{totalPoints}</span>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className={styles.sectionBlock}>
            <span className={styles.sectionHeading}>Recommendation</span>

            <div className={styles.recommendationBox}>
              <span className={styles.recommendationLabel}>
                RECOMMENDED ACTION
              </span>
              <p className={styles.recommendationText}>
                &ldquo;{recommendationText}&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.drawerFooter}>
          <button
            type="button"
            className={styles.btnOpenInvestigation}
            onClick={handleOpenInvestigation}
          >
            Open Investigation
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
