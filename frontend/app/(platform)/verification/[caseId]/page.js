"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldAlert,
  UserRound,
  Map,
  FileText,
  Scale,
  ArrowRightLeft,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  ExternalLink,
  Save,
  XCircle,
  MessageSquareText,
} from "lucide-react";

import {
  getVerificationCase,
  decideVerificationCase,
} from "@/services/api/verification";
import { getParcelById } from "@/services/api/parcels";
import { getEvidenceByParcel } from "@/services/api/validation";
import { getDocumentsByParcel } from "@/services/api/documents";
import ValidationCheckCenter from "@/components/validation/ValidationCheckCenter";
import ThreeColumnVerificationWorkspace from "@/components/verification/ThreeColumnVerificationWorkspace";

import styles from "./verification-case.module.css";

export default function VerificationCasePage() {
  const params = useParams();
  const router = useRouter();

  const [verificationCase, setVerificationCase] = useState(null);
  const [parcel, setParcel] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [decision, setDecision] = useState("");
  const [notes, setNotes] = useState("");
  
  const [actionMessage, setActionMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCase() {
      try {
        setLoading(true);
        setError("");

        let caseData, parcelData, evidenceData, documentData;
        try {
          caseData = await getVerificationCase(params.caseId);
          const parcelId = caseData.parcelId;
          [parcelData, evidenceData, documentData] = await Promise.all([
            getParcelById(parcelId),
            getEvidenceByParcel(parcelId),
            getDocumentsByParcel(parcelId),
          ]);
        } catch (fetchErr) {
          console.warn("Backend API unreachable, using mock verification fallback:", fetchErr);
          const [mockVerifService, mockParcelService, mockValService, mockDocService] = await Promise.all([
            import("@/services/mock/verification"),
            import("@/services/mock/parcels"),
            import("@/services/mock/validation"),
            import("@/services/mock/documents"),
          ]);
          caseData = await mockVerifService.getVerificationCase(params.caseId).catch(() => mockVerifService.getVerificationCase("CASE-V-001"));
          const parcelId = caseData.parcelId || "PRC-001";
          parcelData = await mockParcelService.getParcelById(parcelId).catch(() => mockParcelService.getParcelById("PRC-001"));
          evidenceData = await mockValService.getEvidenceByParcel(parcelId).catch(() => []);
          documentData = await mockDocService.getDocumentsByParcel(parcelId).catch(() => []);
        }

        setVerificationCase(caseData);
        setParcel(parcelData);
        setEvidence(evidenceData || []);
        setDocuments(documentData || []);
      } catch (err) {
        setError(err.message || "Unable to load verification case.");
      } finally {
        setLoading(false);
      }
    }

    if (params.caseId) {
      loadCase();
    }
  }, [params.caseId]);

  const conflicts = useMemo(() => {
    return parcel?.risk?.factors || [];
  }, [parcel]);

  async function handleDecision() {
    if (!decision) {
      setActionMessage({
        type: "error",
        text: "Please select an officer decision.",
      });
      return;
    }

    if (!notes.trim()) {
      setActionMessage({
        type: "error",
        text: "Please add officer remarks before saving.",
      });
      return;
    }

    try {
      setSaving(true);
      setActionMessage(null);

      const result = await decideVerificationCase({
        caseId: params.caseId,
        decision,
        notes,
        userId: "USR-001",
      });

      setVerificationCase(result);
      setSaved(true);

      setActionMessage({
        type: "success",
        text: `Decision saved successfully. Case status: ${result.status}`,
      });
    } catch (error) {
      setActionMessage({
        type: "error",
        text: error.message || "Failed to save decision.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading verification case...</p>
      </div>
    );
  }

  if (error || !verificationCase || !parcel) {
    return (
      <div className={styles.empty}>
        <AlertTriangle size={28} />

        <h2>Unable to load verification case</h2>

        <p>{error || "Case data was not found."}</p>

        <button onClick={() => router.push("/verification")}>
          <ArrowLeft size={15} />
          Back to Verification
        </button>
      </div>
    );
  }

  const riskScore = parcel.risk?.score ?? verificationCase.riskScore ?? "—";

  const riskLevel =
    parcel.risk?.level ??
    verificationCase.priority ??
    verificationCase.riskLevel ??
    "HIGH";

  const status = verificationCase.status || "PENDING_REVIEW";

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <button
            className={styles.backLink}
            onClick={() => router.push("/verification")}
          >
            <ArrowLeft size={16} />
            Back to Verification Queue
          </button>

          <div className={styles.titleRow}>
            <div className={styles.titleIcon}>
              <ShieldAlert size={23} />
            </div>

            <div>
              <div className={styles.eyebrow}>VERIFICATION CASE</div>

              <h1>{verificationCase.id}</h1>

              <p>
                Evidence-assisted review for parcel <strong>{parcel.id}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          <StatusBadge status={status} />
          <RiskBadge level={riskLevel} score={riskScore} />
        </div>
      </header>

      {/* Case summary */}
      <section className={styles.caseSummary}>
        <SummaryItem
          icon={<Map size={17} />}
          label="Parcel"
          value={parcel.id}
          subValue={`Survey ${parcel.surveyNumber || "—"}`}
        />

        <SummaryItem
          icon={<UserRound size={17} />}
          label="Recorded Owner"
          value={parcel.owner?.name || parcel.currentRecordedOwner || "—"}
          subValue="Current land record"
        />

        <SummaryItem
          icon={<Clock3 size={17} />}
          label="Priority"
          value={riskLevel}
          subValue={`Risk score ${riskScore}`}
        />

        <SummaryItem
          icon={<UserRound size={17} />}
          label="Assigned Officer"
          value={verificationCase.assignedUser?.name || "Unassigned"}
          subValue={verificationCase.assignedUser?.role || "Revenue Officer"}
        />
      </section>

      {/* Main review workspace */}
      <div className={styles.workspace}>
        <main className={styles.mainContent}>
          {/* Three Column Verification Workspace */}
          <section className={styles.section}>
            <ThreeColumnVerificationWorkspace parcelData={parcel} />
          </section>

          {/* Validation Check Center (Prominent 12-Check Interactive Panel) */}
          <section className={styles.section}>
            <ValidationCheckCenter parcelId={parcel.id} />
          </section>

          {/* Review objective */}
          <section className={styles.section}>
            <SectionHeader
              eyebrow="REVIEW OBJECTIVE"
              title="Why this case requires verification"
              icon={<ShieldAlert size={18} />}
            />

            <div className={styles.objectiveBox}>
              <div className={styles.objectiveIcon}>
                <AlertTriangle size={19} />
              </div>

              <div>
                <h3>Evidence inconsistencies were detected</h3>

                <p>
                  The automated reconciliation engine has identified signals
                  that require human review. The officer should inspect the
                  underlying evidence before recording a decision.
                </p>
              </div>
            </div>

            <div className={styles.signalGrid}>
              <Signal
                label="RoR Area"
                value={
                  parcel.recordedArea !== undefined
                    ? `${parcel.recordedArea} ha`
                    : "—"
                }
                status="REFERENCE"
              />

              <Signal
                label="Registration Area"
                value={
                  parcel.registration?.area !== undefined
                    ? `${parcel.registration.area} ha`
                    : "—"
                }
                status={
                  parcel.registration?.area !== parcel.recordedArea
                    ? "MISMATCH"
                    : "MATCH"
                }
              />

              <Signal
                label="GIS Area"
                value={
                  parcel.gis?.area !== undefined ? `${parcel.gis.area} ha` : "—"
                }
                status={
                  parcel.gis?.area !== parcel.recordedArea
                    ? "MISMATCH"
                    : "MATCH"
                }
              />

              <Signal
                label="Court Signal"
                value={parcel.courtCase?.status || "No active signal"}
                status={parcel.courtCase ? "REVIEW" : "CLEAR"}
              />
            </div>
          </section>

          {/* Evidence */}
          <section className={styles.section}>
            <SectionHeader
              eyebrow="SOURCE EVIDENCE"
              title="Evidence available to the officer"
              icon={<FileText size={18} />}
              count={evidence.length}
            />

            {evidence.length === 0 ? (
              <EmptySection text="No field-level evidence available." />
            ) : (
              <div className={styles.evidenceList}>
                {evidence.map((item, index) => (
                  <EvidenceItem key={item.id || index} evidence={item} />
                ))}
              </div>
            )}
          </section>

          {/* Documents */}
          <section className={styles.section}>
            <SectionHeader
              eyebrow="SOURCE DOCUMENTS"
              title="Documents linked to this parcel"
              icon={<FileText size={18} />}
              count={documents.length}
            />

            <div className={styles.documentGrid}>
              {documents.map((document) => (
                <DocumentCard key={document.id} document={document} />
              ))}
            </div>
          </section>

          {/* Transaction */}
          <section className={styles.section}>
            <SectionHeader
              eyebrow="TRANSACTION EVIDENCE"
              title="Registration and mutation"
              icon={<ArrowRightLeft size={18} />}
            />

            <div className={styles.transactionGrid}>
              <TransactionCard
                icon={<ArrowRightLeft size={17} />}
                title="Registration"
                data={parcel.registration}
              />

              <TransactionCard
                icon={<RefreshCw size={17} />}
                title="Mutation"
                data={parcel.mutation}
              />
            </div>
          </section>

          {/* Spatial */}
          <section className={styles.section}>
            <SectionHeader
              eyebrow="SPATIAL EVIDENCE"
              title="GIS reconciliation"
              icon={<Map size={18} />}
            />

            <div className={styles.spatialCard}>
              <div className={styles.spatialValues}>
                <SpatialValue
                  label="Recorded Area"
                  value={
                    parcel.recordedArea !== undefined
                      ? `${parcel.recordedArea} ha`
                      : "—"
                  }
                />

                <div className={styles.spatialOperator}>vs</div>

                <SpatialValue
                  label="GIS Area"
                  value={
                    parcel.gis?.area !== undefined
                      ? `${parcel.gis.area} ha`
                      : "—"
                  }
                  danger={parcel.gis?.area !== parcel.recordedArea}
                />
              </div>

              <div className={styles.spatialMessage}>
                <Map size={16} />

                <span>
                  {parcel.gis?.area !== parcel.recordedArea
                    ? "Spatial and textual area values require officer review."
                    : "Spatial and textual area values are consistent."}
                </span>
              </div>

              <button
                className={styles.secondaryButton}
                onClick={() => router.push(`/records/${parcel.id}/gis`)}
              >
                Open GIS Analysis
                <ExternalLink size={14} />
              </button>
            </div>
          </section>

          {/* Court */}
          <section className={styles.section}>
            <SectionHeader
              eyebrow="LEGAL / DISPUTE SIGNAL"
              title="Court information"
              icon={<Scale size={18} />}
            />

            {parcel.courtCase ? (
              <div className={styles.courtCard}>
                <div className={styles.courtIcon}>
                  <Scale size={18} />
                </div>

                <div className={styles.courtContent}>
                  <div className={styles.courtTop}>
                    <strong>
                      {parcel.courtCase.caseNumber || parcel.courtCase.id}
                    </strong>

                    <span>{parcel.courtCase.status || "—"}</span>
                  </div>

                  <p>
                    {parcel.courtCase.caseType || "Property-related dispute"}
                  </p>

                  <div className={styles.courtMeta}>
                    <span>Court: {parcel.courtCase.courtName || "—"}</span>

                    <span>Filed: {formatDate(parcel.courtCase.filedDate)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <EmptySection text="No court/dispute record is linked to this parcel." />
            )}
          </section>

          {/* Ownership */}
          <section className={styles.section}>
            <SectionHeader
              eyebrow="OWNERSHIP HISTORY"
              title="Historical ownership"
              icon={<UserRound size={18} />}
            />

            <OwnershipHistory parcel={parcel} />

            <button
              className={styles.secondaryButton}
              onClick={() => router.push(`/records/${parcel.id}/timeline`)}
            >
              Open Full Ownership Timeline
              <ExternalLink size={14} />
            </button>
          </section>
        </main>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Components & Helpers
--------------------------------------------------------- */

function SummaryItem({ icon, label, value, subValue }) {
  return (
    <div className={styles.summaryItem}>
      <div className={styles.summaryItemIcon}>{icon}</div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{subValue}</small>
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, icon, count }) {
  return (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionTitle}>
        <div className={styles.sectionIcon}>{icon}</div>

        <div>
          <span>{eyebrow}</span>
          <h2>{title}</h2>
        </div>
      </div>

      {count !== undefined && (
        <span className={styles.countBadge}>{count}</span>
      )}
    </div>
  );
}

function Signal({ label, value, status }) {
  const mismatch = status === "MISMATCH";
  const review = status === "REVIEW";

  return (
    <div
      className={`${styles.signal} ${
        mismatch || review ? styles.signalWarning : ""
      }`}
    >
      <span>{label}</span>

      <strong>{value}</strong>

      <small>{mismatch ? "Requires review" : status}</small>
    </div>
  );
}

function EvidenceItem({ evidence }) {
  const confidence =
    evidence.confidence !== undefined ? Number(evidence.confidence) : null;

  return (
    <div className={styles.evidenceItem}>
      <div className={styles.evidenceIcon}>
        <FileText size={16} />
      </div>

      <div className={styles.evidenceMain}>
        <div className={styles.evidenceTop}>
          <strong>
            {evidence.field || evidence.fieldName || "Evidence Field"}
          </strong>

          {confidence !== null && (
            <span
              className={
                confidence >= 90
                  ? styles.confidenceHigh
                  : styles.confidenceMedium
              }
            >
              {confidence}% confidence
            </span>
          )}
        </div>

        <p>{evidence.value || evidence.normalizedValue || "—"}</p>

        <div className={styles.evidenceMeta}>
          <span>
            Source: {evidence.source || evidence.sourceType || "Document"}
          </span>

          {evidence.documentId && <span>Document: {evidence.documentId}</span>}

          {evidence.page !== undefined && evidence.page !== null && (
            <span>Page {evidence.page}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentCard({ document }) {
  return (
    <div className={styles.documentCard}>
      <div className={styles.documentIcon}>
        <FileText size={17} />
      </div>

      <div>
        <strong>{document.documentNumber || document.id}</strong>

        <span>{document.documentType || "Land Record Document"}</span>

        <small>{document.language || "Source document"}</small>
      </div>
    </div>
  );
}

function TransactionCard({ icon, title, data }) {
  if (!data) {
    return (
      <div className={styles.transactionCard}>
        <div className={styles.transactionIcon}>{icon}</div>

        <div>
          <span>{title}</span>
          <strong>No record available</strong>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.transactionCard}>
      <div className={styles.transactionIcon}>{icon}</div>

      <div>
        <span>{title}</span>

        <strong>
          {data.id ||
            data.registrationNumber ||
            data.mutationNumber ||
            "Record"}
        </strong>

        <small>
          {data.date ||
            data.registrationDate ||
            data.mutationDate ||
            "Date unavailable"}
        </small>
      </div>
    </div>
  );
}

function SpatialValue({ label, value, danger }) {
  return (
    <div
      className={`${styles.spatialValue} ${danger ? styles.spatialDanger : ""}`}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function OwnershipHistory({ parcel }) {
  const history =
    parcel.ownershipHistory?.events || parcel.ownershipHistory || [];

  if (!Array.isArray(history) || history.length === 0) {
    return <EmptySection text="No ownership history available." />;
  }

  const latest = history.slice(-4).reverse();

  return (
    <div className={styles.history}>
      {latest.map((event, index) => (
        <div className={styles.historyItem} key={event.id || index}>
          <div className={styles.historyDot} />

          <div>
            <strong>
              {event.ownerName || event.owner || event.name || "Owner"}
            </strong>

            <span>{event.date || event.year || "Historical record"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function DecisionOption({ selected, icon, title, description, onClick }) {
  return (
    <button
      type="button"
      className={`${styles.decisionOption} ${
        selected ? styles.decisionSelected : ""
      }`}
      onClick={onClick}
    >
      <div className={styles.decisionOptionIcon}>{icon}</div>

      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
    </button>
  );
}

function StatusBadge({ status }) {
  return <span className={styles.statusBadge}>{status}</span>;
}

function RiskBadge({ level, score }) {
  return <span className={styles.riskBadge}>{level} ({score})</span>;
}

function EmptySection({ text }) {
  return <div className={styles.empty}>{text}</div>;
}

function formatDate(d) {
  if (!d) return "—";
  return String(d);
}
