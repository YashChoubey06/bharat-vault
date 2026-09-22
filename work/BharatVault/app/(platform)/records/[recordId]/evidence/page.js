"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  MapPin,
  ShieldCheck,
  Search,
} from "lucide-react";

import { getParcelById } from "@/services/mock/parcels";
import { getEvidenceByParcel } from "@/services/mock/validation";
import { getDocumentsByParcel } from "@/services/mock/documents";

import styles from "./evidence.module.css";

export default function EvidencePage() {
  const params = useParams();
  const router = useRouter();

  const recordId = params.recordId;

  const [parcel, setParcel] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvidence() {
      try {
        setLoading(true);
        setError("");

        const [parcelData, evidenceData, documentData] =
          await Promise.all([
            getParcelById(recordId),
            getEvidenceByParcel(recordId),
            getDocumentsByParcel(recordId),
          ]);

        setParcel(parcelData);
        setEvidence(evidenceData);
        setDocuments(documentData);
      } catch (err) {
        setError(
          err.message ||
            "Unable to load parcel evidence."
        );
      } finally {
        setLoading(false);
      }
    }

    if (recordId) {
      loadEvidence();
    }
  }, [recordId]);

  const filteredEvidence = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return evidence;
    }

    return evidence.filter((item) => {
      return (
        item.field?.toLowerCase().includes(term) ||
        item.value
          ?.toString()
          .toLowerCase()
          .includes(term) ||
        item.sourceType
          ?.toLowerCase()
          .includes(term) ||
        item.documentId
          ?.toLowerCase()
          .includes(term)
      );
    });
  }, [evidence, search]);

  if (loading) {
    return (
      <div className={styles.state}>
        Loading evidence...
      </div>
    );
  }

  if (error || !parcel) {
    return (
      <div className={styles.state}>
        <AlertTriangle size={20} />

        <span>
          {error || "Parcel not found."}
        </span>

        <button
          type="button"
          onClick={() =>
            router.push(
              `/records/${recordId}`
            )
          }
        >
          Back to Parcel
        </button>
      </div>
    );
  }

  const highConfidenceCount =
    evidence.filter(
      (item) => Number(item.confidence) >= 0.9
    ).length;

  const averageConfidence =
    evidence.length > 0
      ? evidence.reduce(
          (sum, item) =>
            sum + Number(item.confidence || 0),
          0
        ) / evidence.length
      : 0;

  return (
    <div className={styles.page}>
      {/* Back */}
      <button
        type="button"
        className={styles.backButton}
        onClick={() =>
          router.push(
            `/records/${recordId}`
          )
        }
      >
        <ArrowLeft size={15} />
        Back to Parcel
      </button>

      {/* Header */}
      <header className={styles.header}>
        <div>
          <div className={styles.eyebrow}>
            PARCEL INTELLIGENCE / EVIDENCE
          </div>

          <h1>Evidence</h1>

          <p>
            Trace every extracted value back to its
            originating record and extraction evidence.
          </p>
        </div>

        <div className={styles.parcelBadge}>
          <span>Parcel</span>
          <strong>{parcel.id}</strong>
          <small>
            Survey {parcel.surveyNumber}
          </small>
        </div>
      </header>

      {/* Summary */}
      <div className={styles.summaryGrid}>
        <SummaryCard
          icon={FileText}
          label="Evidence Items"
          value={evidence.length}
          description="Linked evidence records"
        />

        <SummaryCard
          icon={ShieldCheck}
          label="High Confidence"
          value={highConfidenceCount}
          description="Confidence ≥ 90%"
        />

        <SummaryCard
          icon={CheckCircle2}
          label="Average Confidence"
          value={`${Math.round(
            averageConfidence * 100
          )}%`}
          description="Across extracted evidence"
        />

        <SummaryCard
          icon={FileText}
          label="Source Documents"
          value={documents.length}
          description="Documents linked to parcel"
        />
      </div>

      {/* Search */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={16} />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search field, value, source or document..."
          />
        </div>

        <div className={styles.resultCount}>
          Showing{" "}
          <strong>
            {filteredEvidence.length}
          </strong>{" "}
          evidence items
        </div>
      </div>

      {/* Evidence list */}
      {filteredEvidence.length === 0 ? (
        <div className={styles.empty}>
          <Search size={22} />

          <h3>No evidence found</h3>

          <p>
            Try a different search term.
          </p>
        </div>
      ) : (
        <div className={styles.evidenceList}>
          {filteredEvidence.map(
            (item, index) => (
              <EvidenceCard
                key={`${item.documentId}-${item.field}-${index}`}
                evidence={item}
              />
            )
          )}
        </div>
      )}

      {/* Source documents */}
      <section className={styles.documentsSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Source Documents</h2>
            <p>
              Documents contributing evidence to this
              parcel.
            </p>
          </div>
        </div>

        <div className={styles.documentsGrid}>
          {documents.map((document) => (
            <div
              key={document.id}
              className={styles.documentCard}
            >
              <div className={styles.documentIcon}>
                <FileText size={17} />
              </div>

              <div className={styles.documentInfo}>
                <strong>{document.id}</strong>

                <span>
                  {document.documentType}
                </span>

                <small>
                  {document.language || "Unknown language"}
                </small>
              </div>

              <button
                type="button"
                title="View document"
                onClick={() =>
                  router.push(
                    `/documents/${document.id}`
                  )
                }
              >
                <ExternalLink size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* =========================================
   SUMMARY CARD
========================================= */

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
}) {
  return (
    <div className={styles.summaryCard}>
      <div className={styles.summaryIcon}>
        <Icon size={17} />
      </div>

      <div>
        <span>{label}</span>

        <strong>{value}</strong>

        <small>{description}</small>
      </div>
    </div>
  );
}

/* =========================================
   EVIDENCE CARD
========================================= */

function EvidenceCard({
  evidence,
}) {
  const confidence =
    Number(evidence.confidence || 0) * 100;

  const highConfidence =
    confidence >= 90;

  return (
    <article className={styles.evidenceCard}>
      {/* Top */}
      <div className={styles.evidenceHeader}>
        <div className={styles.fieldInfo}>
          <span>EXTRACTED FIELD</span>

          <h2>
            {formatFieldName(
              evidence.field
            )}
          </h2>
        </div>

        <div
          className={
            highConfidence
              ? styles.confidenceHigh
              : styles.confidenceMedium
          }
        >
          {highConfidence ? (
            <CheckCircle2 size={13} />
          ) : (
            <AlertTriangle size={13} />
          )}

          {Math.round(confidence)}% confidence
        </div>
      </div>

      {/* Value */}
      <div className={styles.valueBox}>
        <span>Extracted Value</span>

        <strong>
          {evidence.value || "—"}
        </strong>
      </div>

      {/* Evidence metadata */}
      <div className={styles.metadata}>
        <MetadataItem
          label="Source"
          value={
            evidence.sourceType || "—"
          }
        />

        <MetadataItem
          label="Document"
          value={
            evidence.documentId || "—"
          }
        />

        <MetadataItem
          label="Page"
          value={
            evidence.page
              ? `Page ${evidence.page}`
              : "—"
          }
        />

        <MetadataItem
          label="Evidence Type"
          value={
            evidence.evidenceType || "Extracted"
          }
        />
      </div>

      {/* Provenance */}
      <div className={styles.provenance}>
        <div className={styles.provenanceIcon}>
          <MapPin size={14} />
        </div>

        <div>
          <strong>
            Extraction provenance
          </strong>

          <span>
            Source location is linked to the
            originating document and page.
          </span>
        </div>

        {evidence.bbox && (
          <code>
            [{evidence.bbox.join(", ")}]
          </code>
        )}
      </div>
    </article>
  );
}

/* =========================================
   METADATA
========================================= */

function MetadataItem({
  label,
  value,
}) {
  return (
    <div className={styles.metadataItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/* =========================================
   FIELD FORMATTER
========================================= */

function formatFieldName(field) {
  if (!field) {
    return "Unknown Field";
  }

  return field
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}