"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UploadCloud,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Plus,
  Play,
  Check,
  RefreshCw,
  Sparkles,
  HelpCircle,
  FileCheck,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

import { getParcels } from "@/services/api/parcels";
import { uploadDocument } from "@/services/api/documents";
import { useAuth } from "@/context/AuthContext";
import styles from "./upload.module.css";

/* -------------------------------------------------------------------------- */
/* Pipeline Steps definition                                                  */
/* -------------------------------------------------------------------------- */
const PIPELINE_STEPS = [
  { id: "upload", label: "Upload" },
  { id: "preprocessing", label: "Image preprocessing" },
  { id: "ocr", label: "OCR extraction" },
  { id: "extraction", label: "Field extraction" },
  { id: "validation", label: "Validation" },
  { id: "risk", label: "Risk analysis" },
];

/* Default initial sample files matching prompt specification */
const DEFAULT_FILES = [
  { id: "file-1", name: "khasra_124.pdf", size: "8.4 MB", type: "Current RoR" },
  { id: "file-2", name: "mutation_2021.pdf", size: "4.2 MB", type: "Mutation Record" },
  { id: "file-3", name: "registry_scan.jpg", size: "6.1 MB", type: "Registration Deed" },
];

export default function DocumentUploadPage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [parcels, setParcels] = useState([]);
  const [parcelId, setParcelId] = useState("");
  const [documentType, setDocumentType] = useState("Auto detect");
  const [language, setLanguage] = useState("eng+hin");
  const [selectedFiles, setSelectedFiles] = useState(DEFAULT_FILES);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState("");

  // Document Processing table row statuses
  const [documentRows, setDocumentRows] = useState([
    {
      name: "RoR_124.pdf",
      ocr: "DONE",
      extraction: "DONE",
      validation: "ACTIVE",
      status: "Processing",
    },
    {
      name: "Mutation.pdf",
      ocr: "DONE",
      extraction: "DONE",
      validation: "DONE",
      status: "Completed",
    },
    {
      name: "Map.jpg",
      ocr: "DONE",
      extraction: "ACTIVE",
      validation: "PENDING",
      status: "Processing",
    },
  ]);

  useEffect(() => {
    getParcels()
      .then((data) => {
        setParcels(data);
        if (data.length > 0) {
          setParcelId(data[0].id);
        }
      })
      .catch((err) => console.warn("Using default parcel context:", err));
  }, []);

  /* -------------------------------------------------------------------------- */
  /* Live Staggered Processing Simulation (Land Lens Add-on)                   */
  /* -------------------------------------------------------------------------- */
  function handleStartProcessing() {
    if (selectedFiles.length === 0) {
      setError("Please select at least one file to process.");
      return;
    }

    setError("");
    setIsProcessing(true);
    setIsComplete(false);
    setCurrentStepIndex(0);
    setOverallProgress(15);

    // Initial document rows state
    setDocumentRows([
      { name: selectedFiles[0]?.name || "khasra_124.pdf", ocr: "ACTIVE", extraction: "PENDING", validation: "PENDING", status: "Processing" },
      { name: selectedFiles[1]?.name || "mutation_2021.pdf", ocr: "PENDING", extraction: "PENDING", validation: "PENDING", status: "Processing" },
      { name: selectedFiles[2]?.name || "registry_scan.jpg", ocr: "PENDING", extraction: "PENDING", validation: "PENDING", status: "Processing" },
    ]);

    // Step 0: Upload complete -> Step 1: Preprocessing
    setTimeout(() => {
      setCurrentStepIndex(1);
      setOverallProgress(32);
      setDocumentRows([
        { name: selectedFiles[0]?.name || "khasra_124.pdf", ocr: "DONE", extraction: "ACTIVE", validation: "PENDING", status: "Processing" },
        { name: selectedFiles[1]?.name || "mutation_2021.pdf", ocr: "DONE", extraction: "ACTIVE", validation: "PENDING", status: "Processing" },
        { name: selectedFiles[2]?.name || "registry_scan.jpg", ocr: "DONE", extraction: "PENDING", validation: "PENDING", status: "Processing" },
      ]);
    }, 800);

    // Step 1: Preprocessing complete -> Step 2: OCR extraction
    setTimeout(() => {
      setCurrentStepIndex(2);
      setOverallProgress(48); // Prompt explicitly specifies 48% overall progress during OCR stage
      setDocumentRows([
        { name: selectedFiles[0]?.name || "khasra_124.pdf", ocr: "DONE", extraction: "DONE", validation: "ACTIVE", status: "Processing" },
        { name: selectedFiles[1]?.name || "mutation_2021.pdf", ocr: "DONE", extraction: "DONE", validation: "DONE", status: "Completed" },
        { name: selectedFiles[2]?.name || "registry_scan.jpg", ocr: "DONE", extraction: "ACTIVE", validation: "PENDING", status: "Processing" },
      ]);
    }, 1700);

    // Step 2: OCR complete -> Step 3: Field extraction
    setTimeout(() => {
      setCurrentStepIndex(3);
      setOverallProgress(68);
    }, 2500);

    // Step 3: Extraction complete -> Step 4: Validation
    setTimeout(() => {
      setCurrentStepIndex(4);
      setOverallProgress(85);
      setDocumentRows([
        { name: selectedFiles[0]?.name || "khasra_124.pdf", ocr: "DONE", extraction: "DONE", validation: "DONE", status: "Requires Review" },
        { name: selectedFiles[1]?.name || "mutation_2021.pdf", ocr: "DONE", extraction: "DONE", validation: "DONE", status: "Completed" },
        { name: selectedFiles[2]?.name || "registry_scan.jpg", ocr: "DONE", extraction: "DONE", validation: "DONE", status: "Completed" },
      ]);
    }, 3300);

    // Step 5: Risk analysis & Pipeline Completion
    setTimeout(() => {
      setCurrentStepIndex(5);
      setOverallProgress(100);
      setIsComplete(true);
      setIsProcessing(false);
    }, 4100);
  }

  function handleFileAdd(event) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const newItems = files.map((file, idx) => ({
      id: `custom-${Date.now()}-${idx}`,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: documentType,
    }));

    setSelectedFiles((prev) => [...prev, ...newItems]);
  }

  function handleRemoveFile(id) {
    setSelectedFiles((prev) => prev.filter((item) => item.id !== id));
  }

  function handleRemoveAllFiles() {
    setSelectedFiles([]);
  }

  return (
    <div className={styles.page}>
      <Link href="/documents" className={styles.backLink}>
        <ArrowLeft size={16} />
        Back to Documents
      </Link>

      <header className={styles.header}>
        <div className={styles.eyebrow}>EVIDENCE INGESTION & PIPELINE</div>
        <h1>Upload Source Evidence</h1>
        <p>
          Ingest RoR, Mutation records, and GIS extracts into Bharat Vault for automated 
          OCR extraction, cross-register validation, and risk scoring.
        </p>
      </header>

      <div className={styles.grid}>
        {/* Left Column: Upload Form & File Selection */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            <UploadCloud size={20} className={styles.docIcon} />
            Document Selection & Options
          </h2>

          <div className={styles.formGroup}>
            <label>Linked Parcel Record</label>
            <select
              className={styles.selectInput}
              value={parcelId}
              onChange={(e) => setParcelId(e.target.value)}
            >
              {parcels.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} · Survey {p.surveyNumber} ({p.currentRecordedOwner})
                </option>
              ))}
              <option value="PRC-001">PRC-001 · Khasra 124/2 (Ramashanker Verma)</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Document Type</label>
            <select
              className={styles.selectInput}
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
            >
              <option value="Auto detect">Auto detect</option>
              <option value="Current RoR">Current RoR (Record of Rights)</option>
              <option value="Historical RoR">Historical RoR</option>
              <option value="Registration Deed">Registration Deed</option>
              <option value="Mutation Record">Mutation Record</option>
              <option value="GIS Extract">GIS Map / Cadastral Extract</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>OCR Language Model</label>
            <select
              className={styles.selectInput}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="eng+hin">English + Hindi (Devanagari OCR)</option>
              <option value="eng">English Only</option>
              <option value="hin">Hindi Only</option>
            </select>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            className={styles.hiddenFileInput}
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff"
            onChange={handleFileAdd}
          />

          {/* Drag & Drop Zone */}
          <div
            className={styles.dropZone}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className={styles.dropIcon}>
              <UploadCloud size={22} />
            </div>
            <span className={styles.dropText}>Click or drag files here to upload</span>
            <span className={styles.dropSub}>Supports PDF, PNG, JPEG, TIFF up to 20 MB</span>
          </div>

          {/* Selected Files Section */}
          {selectedFiles.length > 0 && (
            <div>
              <div className={styles.fileSelectionHeader}>
                <strong>Files Selected</strong>
                <span>{selectedFiles.length} file(s)</span>
              </div>

              <div className={styles.fileList} style={{ marginTop: "10px" }}>
                {selectedFiles.map((file) => (
                  <div key={file.id} className={styles.fileItem}>
                    <div className={styles.fileItemLeft}>
                      <CheckCircle2 size={16} className={styles.fileCheckIcon} />
                      <span className={styles.fileName}>✓ {file.name}</span>
                    </div>
                    <span className={styles.fileSize}>{file.size}</span>
                  </div>
                ))}
              </div>

              <div className={styles.fileActionsRow}>
                <div className={styles.btnGroup}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={handleRemoveAllFiles}
                    disabled={isProcessing}
                  >
                    [ Remove ]
                  </button>

                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                  >
                    [ Add More ]
                  </button>
                </div>

                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handleStartProcessing}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={15} className={styles.iconActive} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play size={15} />
                      [ Start Processing ]
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {error && <p style={{ color: "#ef4444", fontSize: "12px", margin: 0 }}>{error}</p>}
        </div>

        {/* Right Column: Live Staggered Progress Pipeline (Land Lens Add-on) */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            <Sparkles size={20} style={{ color: "#2563eb" }} />
            Progress & Staggered Reveal
          </h2>

          <div className={styles.progressPanel}>
            <div className={styles.progressHeader}>
              <div className={styles.progressTitleGroup}>
                <h3>Processing Records</h3>
              </div>

              <span className={styles.overallBadge}>
                Overall: {overallProgress}%
              </span>
            </div>

            <div className={styles.progressBarTrack}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${overallProgress}%` }}
              />
            </div>

            {/* Staggered Checklist: Each line item reveals sequentially */}
            <div className={styles.pipelineList}>
              {PIPELINE_STEPS.map((step, index) => {
                const isRevealed = currentStepIndex >= index;
                const isDone = currentStepIndex > index || isComplete;
                const isActive = currentStepIndex === index && !isComplete;

                if (!isRevealed && currentStepIndex === -1) {
                  // Display standard initial items before start processing
                  const defaultDone = index < 2;
                  const defaultActive = index === 2;

                  return (
                    <div
                      key={step.id}
                      className={styles.pipelineItem}
                      style={{ opacity: 1 }}
                    >
                      <div className={styles.statusIconWrapper}>
                        {defaultDone ? (
                          <Check size={16} className={styles.iconDone} />
                        ) : defaultActive ? (
                          <RefreshCw size={15} className={styles.iconActive} />
                        ) : (
                          <span className={styles.iconPending}>○</span>
                        )}
                      </div>
                      <span
                        className={
                          defaultDone
                            ? styles.stepTextCompleted
                            : defaultActive
                            ? styles.stepTextActive
                            : styles.stepTextPending
                        }
                      >
                        {defaultDone ? "✓" : defaultActive ? "●" : "○"} {step.label}
                      </span>
                    </div>
                  );
                }

                if (!isRevealed) return null;

                return (
                  <div
                    key={step.id}
                    className={styles.pipelineItem}
                    style={{ animationDelay: `${(index - (currentStepIndex >= 0 ? currentStepIndex : 0)) * 100}ms` }}
                  >
                    <div className={styles.statusIconWrapper}>
                      {isDone ? (
                        <Check size={16} className={styles.iconDone} />
                      ) : isActive ? (
                        <RefreshCw size={15} className={styles.iconActive} />
                      ) : (
                        <span className={styles.iconPending}>○</span>
                      )}
                    </div>

                    <span
                      className={
                        isDone
                          ? styles.stepTextCompleted
                          : isActive
                          ? styles.stepTextActive
                          : styles.stepTextPending
                      }
                    >
                      {isDone ? "✓" : isActive ? "●" : "○"} {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <p style={{ fontSize: "12px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
            💡 <strong>Land Lens Progressive Disclosure:</strong> Each stage reveals and checks off 
            dynamically as OCR extraction, field parsing, and spatial validation run on your local device.
          </p>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Screen — Document Processing Status Table                             */}
      {/* -------------------------------------------------------------------- */}
      <section className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div>
            <h2>Screen — Document Processing</h2>
            <p>Each document receives continuous multi-stage pipeline status verification</p>
          </div>

          <div className={styles.legendRow}>
            <span className={styles.legendTitle}>Status Types:</span>
            <span className={`${styles.statusBadge} ${styles.statusProcessing}`}>Processing</span>
            <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>Completed</span>
            <span className={`${styles.statusBadge} ${styles.statusWarning}`}>Warning</span>
            <span className={`${styles.statusBadge} ${styles.statusFailed}`}>Failed</span>
            <span className={`${styles.statusBadge} ${styles.statusRequiresReview}`}>Requires Review</span>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.procTable}>
            <thead>
              <tr>
                <th>Document</th>
                <th>OCR</th>
                <th>Extraction</th>
                <th>Validation</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {documentRows.map((doc, i) => (
                <tr key={i}>
                  <td>
                    <div className={styles.docNameCell}>
                      <FileText size={17} className={styles.docIcon} />
                      <span>{doc.name}</span>
                    </div>
                  </td>

                  <td>
                    {doc.ocr === "DONE" ? (
                      <span className={`${styles.stageBadge} ${styles.stageDone}`}>✓</span>
                    ) : doc.ocr === "ACTIVE" ? (
                      <span className={`${styles.stageBadge} ${styles.stageActive}`}>●</span>
                    ) : (
                      <span className={styles.stageDash}>—</span>
                    )}
                  </td>

                  <td>
                    {doc.extraction === "DONE" ? (
                      <span className={`${styles.stageBadge} ${styles.stageDone}`}>✓</span>
                    ) : doc.extraction === "ACTIVE" ? (
                      <span className={`${styles.stageBadge} ${styles.stageActive}`}>●</span>
                    ) : (
                      <span className={styles.stageDash}>—</span>
                    )}
                  </td>

                  <td>
                    {doc.validation === "DONE" ? (
                      <span className={`${styles.stageBadge} ${styles.stageDone}`}>✓</span>
                    ) : doc.validation === "ACTIVE" ? (
                      <span className={`${styles.stageBadge} ${styles.stageActive}`}>●</span>
                    ) : (
                      <span className={styles.stageDash}>—</span>
                    )}
                  </td>

                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        doc.status === "Completed"
                          ? styles.statusCompleted
                          : doc.status === "Warning"
                          ? styles.statusWarning
                          : doc.status === "Failed"
                          ? styles.statusFailed
                          : doc.status === "Requires Review"
                          ? styles.statusRequiresReview
                          : styles.statusProcessing
                      }`}
                    >
                      {doc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isComplete && (
          <div className={styles.completeBanner}>
            <div className={styles.completeText}>
              <ShieldCheck size={20} />
              <span>✓ Ingestion & Risk Scoring Complete! 3 documents processed and verified.</span>
            </div>

            <div className={styles.completeActions}>
              <Link href="/documents" className={styles.btnSecondary}>
                View All Documents
              </Link>
              <Link href="/verification" className={styles.btnPrimary}>
                Review Verification Queue
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
