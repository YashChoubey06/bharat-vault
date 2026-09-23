"use client";

import { useState } from "react";
import { X, AlertTriangle, CheckCircle2, Save, ShieldCheck } from "lucide-react";
import styles from "./VerificationDecisionModal.module.css";

export default function VerificationDecisionModal({
  isOpen = false,
  onClose,
  parcelId = "PRC-001",
  fieldName = "Area",
  aiExtracted = "",
  rorValue = "",
  gisValue = "",
  onSaveDecision,
}) {
  const [selectedDecision, setSelectedDecision] = useState("CONFIRM"); // 'CONFIRM', 'CORRECT', 'CUSTOM'
  const [customValue, setCustomValue] = useState("");
  const [reason, setReason] = useState("");
  const [validationError, setValidationError] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  async function handleSave() {
    setValidationError("");
    setSavedSuccess(false);

    // Mandate reason for corrections
    if (

      !reason.trim()
    ) {
      setValidationError("Reason is mandatory for corrections.");
      return;
    }



    if (selectedDecision === "CUSTOM" && !customValue.trim()) { setValidationError("Enter a corrected value."); return; }
    const finalValue =
      selectedDecision === "CONFIRM"
        ? rorValue
        : selectedDecision === "CORRECT"
        ? gisValue
        : customValue || gisValue;

    if (onSaveDecision) {
      try { await onSaveDecision({
        parcelId,
        field: fieldName,
        decision: selectedDecision,
        value: finalValue,
        reason: reason.trim(),
      }); setSavedSuccess(true); } catch (err) { setValidationError(err.message); return; }
    }

    setTimeout(() => {
      setSavedSuccess(false);
      if (onClose) onClose();
    }, 1200);
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-decision-title"
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.titleGroup}>
            <span className={styles.eyebrow}>PARTICULAR PARCEL DECISION</span>
            <h2 id="modal-decision-title" className={styles.title}>
              <ShieldCheck size={22} style={{ color: "#2563eb" }} />
              Verification Decision — Parcel {parcelId}
            </h2>
            <p className={styles.subtitle}>Source-linked officer review</p>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* Conflict Summary Card */}
          <div className={styles.conflictCard}>
            <div className={styles.conflictHeader}>
              <span className={styles.conflictTitle}>
                <AlertTriangle size={16} />
                Field Inconsistency Detected: {fieldName}
              </span>
              <span className={styles.conflictTag}>⚠ Conflict</span>
            </div>

            <div className={styles.compGrid}>
              <div className={styles.compItem}>
                <span className={styles.compLabel}>AI Extracted Value</span>
                <span className={styles.compValue}>{aiExtracted}</span>
              </div>
              <div className={styles.compItem}>
                <span className={styles.compLabel}>Evidence Comparison</span>
                <span className={styles.compValue}>
                  RoR: {rorValue} | GIS: {gisValue}
                </span>
              </div>
            </div>
          </div>

          {/* Decision Selection */}
          <div className={styles.sectionBlock}>
            <span className={styles.sectionLabel}>Select Officer Action:</span>

            <div className={styles.radioOptions}>
              <label
                className={`${styles.radioCard} ${
                  selectedDecision === "CONFIRM" ? styles.radioSelected : ""
                }`}
              >
                <input
                  type="radio"
                  name="modal_decision"
                  checked={selectedDecision === "CONFIRM"}
                  onChange={() => setSelectedDecision("CONFIRM")}
                />
                Confirm {rorValue} (Record Value)
              </label>



              <label
                className={`${styles.radioCard} ${
                  selectedDecision === "CUSTOM" ? styles.radioSelected : ""
                }`}
              >
                <input
                  type="radio"
                  name="modal_decision"
                  checked={selectedDecision === "CUSTOM"}
                  onChange={() => setSelectedDecision("CUSTOM")}
                />
                Enter another value
              </label>

              {selectedDecision === "CUSTOM" && (
                <input
                  type="text"
                  className={styles.customInput}
                  placeholder="e.g. 2.35 ha"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                />
              )}
            </div>
          </div>

          {/* Reason Block */}
          <div className={styles.sectionBlock}>
            <div className={styles.sectionLabel}>
              <span>Mandatory Officer Reason:</span>
              { (
                <span style={{ color: "#dc2626", fontSize: "11px", fontWeight: "700" }}>
                  * Required for corrections
                </span>
              )}
            </div>

            <textarea
              className={styles.reasonTextarea}
              placeholder="GIS survey conducted in 2025 supersedes previous spatial value."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Error / Success feedback */}
          {validationError && (
            <div className={styles.validationError}>
              <AlertTriangle size={15} />
              {validationError}
            </div>
          )}

          {savedSuccess && (
            <div className={styles.successBanner}>
              <CheckCircle2 size={15} />
              Decision recorded and submitted successfully!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button type="button" className={styles.btnCancel} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={styles.btnSave} onClick={handleSave}>
            <Save size={16} />
            Save Decision
          </button>
        </div>
      </div>
    </div>
  );
}
