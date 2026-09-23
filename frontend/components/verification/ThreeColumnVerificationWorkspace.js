"use client";

import { useState } from "react";
import {
  FileText,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  FileCheck2,
  Layers,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import VerificationDecisionModal from "./VerificationDecisionModal";
import styles from "./ThreeColumnVerificationWorkspace.module.css";

export default function ThreeColumnVerificationWorkspace({
  parcelData,
  onSaveDecision,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalField, setActiveModalField] = useState("Area");
  const [savedDecisionText, setSavedDecisionText] = useState("");

  const recordValues = {
    owner: parcelData?.primaryOwner?.name || "Ramesh Kumar",
    area: parcelData?.areaHa ? `${parcelData.areaHa} ha` : "2.50 ha",
    khasra: parcelData?.surveyNumber || "124/2",
  };

  function handleOpenModal(field = "Area") {
    setActiveModalField(field);
    setIsModalOpen(true);
  }

  function handleSaveDecisionModal(decisionPayload) {
    setSavedDecisionText(`Decision saved: ${decisionPayload.value} (${decisionPayload.decision})`);
    if (onSaveDecision) {
      onSaveDecision(decisionPayload);
    }
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.eyebrow}>PRIMARY OFFICER WORKSPACE</span>
          <h2 className={styles.title}>
            <ShieldCheck size={22} style={{ color: "#2563eb" }} />
            Verification Workspace
          </h2>
        </div>
        <span className={styles.badgePower}>ROW-BASED EVIDENCE RECONCILIATION</span>
      </div>

      {/* Row-based Verification Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.workspaceTable}>
          <thead>
            <tr>
              <th>Field</th>
              <th>Record Value</th>
              <th>Evidence Sources</th>
              <th>Status</th>
              <th>Officer Decision Action</th>
            </tr>
          </thead>

          <tbody>
            {/* ROW 1: Owner */}
            <tr>
              <td className={styles.fieldCell}>Owner</td>
              <td>
                <div className={styles.recordValBox}>
                  <span className={styles.recordVal}>{recordValues.owner}</span>
                  <span className={styles.recordSub}>Primary Landholder</span>
                </div>
              </td>
              <td>
                <div className={styles.evidenceGroup}>
                  <span className={styles.evidenceChip}>
                    <FileText size={12} style={{ color: "#2563eb" }} />
                    RoR: Ramesh Kumar
                  </span>
                  <span className={styles.evidenceChip}>
                    <FileText size={12} style={{ color: "#2563eb" }} />
                    Registration: Ramesh Kumar
                  </span>
                </div>
              </td>
              <td>
                <span className={styles.statusMatch}>✓ Matched</span>
              </td>
              <td>
                <button
                  type="button"
                  className={styles.btnViewDecision}
                  onClick={() => handleOpenModal("Owner")}
                >
                  <CheckCircle2 size={14} />
                  View Decision
                </button>
              </td>
            </tr>

            {/* ROW 2: Area (Conflicting Field) */}
            <tr className={styles.conflictHighlightRow}>
              <td className={styles.fieldCell}>Area</td>
              <td>
                <div className={styles.recordValBox}>
                  <span className={styles.recordVal}>{recordValues.area}</span>
                  <span className={styles.recordSub}>AI Extracted Value</span>
                </div>
              </td>
              <td>
                <div className={styles.evidenceGroup}>
                  <span className={styles.evidenceChip}>
                    <FileText size={12} style={{ color: "#047857" }} />
                    RoR: 2.50 ha
                  </span>
                  <span className={styles.evidenceChip} style={{ border: "1px solid #fde68a", background: "#fffbe6" }}>
                    <MapPin size={12} style={{ color: "#b45309" }} />
                    GIS: 2.20 ha
                  </span>
                </div>
              </td>
              <td>
                <span className={styles.statusConflict}>⚠ Conflict (2.50 vs 2.20)</span>
              </td>
              <td>
                <button
                  type="button"
                  className={styles.btnResolveModal}
                  onClick={() => handleOpenModal("Area")}
                >
                  <AlertTriangle size={14} />
                  Make Pop-Up Decision
                </button>
              </td>
            </tr>

            {/* ROW 3: Khasra */}
            <tr>
              <td className={styles.fieldCell}>Khasra</td>
              <td>
                <div className={styles.recordValBox}>
                  <span className={styles.recordVal}>{recordValues.khasra}</span>
                  <span className={styles.recordSub}>Cadastral Survey No.</span>
                </div>
              </td>
              <td>
                <div className={styles.evidenceGroup}>
                  <span className={styles.evidenceChip}>
                    <FileText size={12} style={{ color: "#2563eb" }} />
                    RoR: 124/2
                  </span>
                  <span className={styles.evidenceChip}>
                    <MapPin size={12} style={{ color: "#2563eb" }} />
                    GIS: 124/2
                  </span>
                </div>
              </td>
              <td>
                <span className={styles.statusMatch}>✓ Matched</span>
              </td>
              <td>
                <button
                  type="button"
                  className={styles.btnViewDecision}
                  onClick={() => handleOpenModal("Khasra")}
                >
                  <CheckCircle2 size={14} />
                  View Decision
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {savedDecisionText && (
        <div style={{ background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", padding: "10px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}>
          <CheckCircle2 size={14} />
          {savedDecisionText}
        </div>
      )}

      {/* Verification Decision Pop-up Modal for Particular Parcel */}
      <VerificationDecisionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        parcelId={parcelData?.id || "PRC-001"}
        fieldName={activeModalField}
        aiExtracted="2.50 hectares"
        rorValue="2.50 ha"
        gisValue="2.20 ha"
        onSaveDecision={handleSaveDecisionModal}
      />
    </div>
  );
}
