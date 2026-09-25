"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  AlertTriangle,
  FileText,
  Search,
  ChevronRight,
  Layers,
  FileSearch,
  MapPin,
  Eye,
} from "lucide-react";

import { getValidationByParcel } from "@/services/api/validation";
import styles from "./ValidationCheckCenter.module.css";

const ICON_MAP = {
  FileText: FileText,
  Eye: Eye,
  Search: Search,
  ChevronRight: ChevronRight,
  MapPin: MapPin,
};

export default function ValidationCheckCenter({ parcelId = "PRC-001" }) {
  const router = useRouter();

  // Load checks for the selected backend parcel.
  const [checksList, setChecksList] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    setChecksList([]); setError("");
    getValidationByParcel(parcelId).then(data => setChecksList((data?.checks || []).map(c => ({...c,
      status: c.status === "MATCH" ? "PASS" : c.status === "CONFLICT" ? "FAIL" : "WARN",
      difference: {text:c.description || c.message || c.reason || c.status},
      actions:[{label:"Inspect source evidence",path:`/records/${parcelId}/evidence`,iconName:"Eye"}]
    })))).catch(err => setError(err.message));
  }, [parcelId]);

  // Default selected check: "Area Consistency" per user prompt interaction flow
  const [selectedCheckId, setSelectedCheckId] = useState("area_consistency");

  const activeCheck =
    checksList.find((c) => c.id === selectedCheckId) ||
    checksList[5] ||
    checksList[0];

  const passCount = checksList.filter((c) => c.status === "PASS").length;
  const warnCount = checksList.filter((c) => c.status === "WARN").length;
  const failCount = checksList.filter((c) => c.status === "FAIL").length;

  function renderActionIcon(iconName) {
    const IconComp = ICON_MAP[iconName] || ChevronRight;
    return <IconComp size={14} />;
  }

  return (
    <div className={styles.container}>
      {error && <p role="alert">{error}</p>}
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.eyebrow}>VALIDATION CHECK CENTER</span>
          <h2 className={styles.title}>
            <ShieldAlert size={20} style={{ color: "#2563eb" }} />
            VALIDATION CHECKS
          </h2>
        </div>

        <div className={styles.badgeSummary}>
          <span className={styles.passChip}>✓ {passCount} Passed</span>
          <span className={styles.warnChip}>⚠ {warnCount} Warnings</span>
          <span className={styles.failChip}>🔴 {failCount} Critical</span>
        </div>
      </div>

      {/* 12 Validation Checks Interactive Grid with Land Lens 500ms soft highlight animation */}
      <div className={styles.checksGrid}>
        {checksList.map((check) => {
          const isSelected = check.id === selectedCheckId;
          const isWarn = check.status === "WARN";
          const isFail = check.status === "FAIL";

          const cardStyle = `${styles.checkCard} ${
            isSelected ? styles.checkCardSelected : ""
          } ${
            isWarn ? styles.softHighlightWarn : isFail ? styles.softHighlightFail : ""
          }`;

          return (
            <div
              key={check.id}
              className={cardStyle}
              onClick={() => setSelectedCheckId(check.id)}
              role="button"
              tabIndex={0}
            >
              <span className={styles.checkName}>{check.name}</span>

              <div
                className={`${styles.checkIconWrapper} ${
                  check.status === "PASS"
                    ? styles.iconPass
                    : check.status === "WARN"
                    ? styles.iconWarn
                    : styles.iconFail
                }`}
              >
                {check.iconSymbol}
              </div>
            </div>
          );
        })}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Interaction Drill-Down Panel                                         */}
      {/* -------------------------------------------------------------------- */}
      {activeCheck && (
        <div className={styles.drillDownPanel}>
          <div className={styles.drillHeader}>
            <div className={styles.drillTitleRow}>
              <FileSearch size={18} style={{ color: "#2563eb" }} />
              <h3>{activeCheck.name} — Investigation Drill-Down</h3>
            </div>

            <span className={styles.stepFlowIndicator}>
              Flow: Clicked {activeCheck.name} → Values → Difference → Documents → Investigation
            </span>
          </div>

          <div className={styles.stepGrid}>
            {/* Step 1: Source Values */}
            <div className={styles.stepBox}>
              <div className={styles.stepBoxTitle}>
                <Layers size={13} />
                1. Source Values
              </div>

              <div className={styles.valueRowList}>
                {activeCheck.sourceValues?.map((sv, idx) => (
                  <div key={idx} className={styles.valueItem}>
                    <span className={styles.valueLabel}>{sv.label}</span>
                    <span className={styles.valueVal}>{sv.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Show Difference */}
            <div className={styles.stepBox}>
              <div className={styles.stepBoxTitle}>
                <AlertTriangle size={13} />
                2. Show Difference
              </div>

              <div
                className={`${styles.differenceHighlight} ${
                  activeCheck.difference?.type === "danger"
                    ? styles.differenceHighlightDanger
                    : activeCheck.difference?.type === "warning"
                    ? styles.differenceHighlightWarn
                    : ""
                }`}
              >
                <div className={styles.calloutBadge}>
                  {activeCheck.difference?.callout}
                </div>

                <span className={styles.differenceTitle}>
                  {activeCheck.difference?.title}
                </span>

                <p className={styles.differenceText}>
                  {activeCheck.difference?.text}
                </p>
              </div>
            </div>
          </div>

          <div className={styles.stepGrid}>
            {/* Step 3: Show Source Documents */}
            <div className={styles.stepBox}>
              <div className={styles.stepBoxTitle}>
                <FileText size={13} />
                3. Show Source Documents
              </div>

              <div className={styles.docList}>
                {activeCheck.sourceDocuments?.map((doc, idx) => (
                  <div key={idx} className={styles.docItem}>
                    <div className={styles.docItemLeft}>
                      <FileText size={14} style={{ color: "#2563eb" }} />
                      <span>{doc.name}</span>
                    </div>
                    <span className={styles.docPageRef}>
                      {doc.page} · {doc.ref}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 4: Allow Investigation */}
            <div className={styles.stepBox}>
              <div className={styles.stepBoxTitle}>
                <Search size={13} />
                4. Allow Investigation
              </div>

              <div className={styles.actionRow}>
                {activeCheck.actions?.map((act, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={
                      idx === 0 ? styles.btnActionPrimary : styles.btnActionSecondary
                    }
                    onClick={() => router.push(act.path)}
                  >
                    {renderActionIcon(act.iconName)}
                    {act.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
