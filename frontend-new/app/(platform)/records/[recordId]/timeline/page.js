"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  History,
  Clock,
  Clock3,
  User,
  GitBranch,
  ShieldCheck,
  FileCheck2,
  AlertTriangle,
  FileText,
  MapPin,
  Maximize2,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

import StatCard from "@/components/ui/StatCard";
import { getParcelById } from "@/services/api/parcels";
import { getDocumentsByParcel } from "@/services/api/documents";
import RecordTabs from "@/components/records/RecordTabs";

import styles from "./timeline.module.css";

export default function ParcelTimelinePage() {
  const params = useParams();
  const router = useRouter();

  const recordId = params.recordId;

  const [parcel, setParcel] = useState(null);
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTimeline() {
      try {
        setLoading(true);
        setError("");

        const [parcelData, documentsData] = await Promise.all([
          getParcelById(recordId),
          getDocumentsByParcel(recordId),
        ]);

        setParcel(parcelData);
        setDocuments(documentsData);
      } catch (err) {
        setError(err.message || "Unable to load ownership timeline.");
      } finally {
        setLoading(false);
      }
    }

    if (recordId) {
      loadTimeline();
    }
  }, [recordId]);

  const timelineEvents = useMemo(() => {
    if (!parcel) return [];

    const events = [];

    /* =========================================
       OWNERSHIP HISTORY
    ========================================= */

    const ownershipHistory = parcel.ownershipHistory;

    if (ownershipHistory?.events) {
      ownershipHistory.events.forEach((item, index) => {
        events.push({
          id: `ownership-${index}`,
          date: item.date || item.effectiveDate || item.year,
          title:
            item.event ||
            item.eventType ||
            item.type ||
            "Ownership Record",
          description:
            item.description ||
            buildOwnershipDescription(item),
          category: "ownership",
          owner:
            item.owner ||
            item.ownerName ||
            item.toOwner ||
            item.newOwner,
          previousOwner:
            item.previousOwner ||
            item.fromOwner ||
            item.seller,
          documentId: item.documentId,
          status: item.status || "RECORDED",
        });
      });
    }

    /* =========================================
       REGISTRATION
    ========================================= */

    if (parcel.registration) {
      events.push({
        id: `registration-${parcel.registration.id || "current"}`,
        date: parcel.registration.date,
        title: "Property Registration",
        description: `Registration recorded between ${parcel.registration.seller} and ${parcel.registration.buyer}.`,
        category: "transaction",
        previousOwner: parcel.registration.seller,
        owner: parcel.registration.buyer,
        documentId: parcel.registration.documentId,
        status: "RECORDED",
        metadata: parcel.registration.registrationNumber,
      });
    }

    /* =========================================
       MUTATION
    ========================================= */

    if (parcel.mutation) {
      events.push({
        id: `mutation-${parcel.mutation.id || "current"}`,
        date: parcel.mutation.date,
        title: "Mutation Recorded",
        description:
          parcel.mutation.description ||
          `Mutation recorded for ${parcel.mutation.mutationType || parcel.mutation.type || "property transaction"}.`,
        category: "mutation",
        previousOwner:
          parcel.mutation.previousOwner ||
          parcel.mutation.fromOwner ||
          parcel.mutation.seller,
        owner:
          parcel.mutation.newOwner ||
          parcel.mutation.toOwner ||
          parcel.mutation.buyer,
        documentId: parcel.mutation.documentId,
        status: parcel.mutation.status || "RECORDED",
        metadata: parcel.mutation.mutationNumber,
      });
    }

    /* =========================================
       DOCUMENTS
    ========================================= */

    documents.forEach((document) => {
      if (!document.date && !document.documentDate && !document.createdAt) {
        return;
      }

      events.push({
        id: `document-${document.id}`,
        date:
          document.date ||
          document.documentDate ||
          document.createdAt,
        title:
          document.documentType ||
          document.type ||
          "Document Added",
        description:
          document.description ||
          `Document ${document.id} is part of the parcel record history.`,
        category: "document",
        documentId: document.id,
        status: document.status || "AVAILABLE",
        metadata: document.language,
      });
    });

    return events
      .filter((event) => event.date)
      .sort((a, b) => {
        return (
          new Date(normalizeDate(b.date)).getTime() -
          new Date(normalizeDate(a.date)).getTime()
        );
      });
  }, [parcel, documents]);

  if (loading) {
    return (
      <div className={styles.state}>
        <Clock size={20} />
        Loading ownership timeline...
      </div>
    );
  }

  if (error || !parcel) {
    return (
      <div className={styles.state}>
        <AlertTriangle size={20} />

        <span>{error || "Parcel not found."}</span>

        <button
          type="button"
          onClick={() => router.push(`/records/${recordId}`)}
        >
          Back to Record
        </button>
      </div>
    );
  }

  const firstEvent = timelineEvents[timelineEvents.length - 1];
  const latestEvent = timelineEvents[0];

  const ownershipEvents = timelineEvents.filter(
    (event) => event.category === "ownership"
  ).length;

  const transactionEvents = timelineEvents.filter(
    (event) =>
      event.category === "transaction" ||
      event.category === "mutation"
  ).length;

  const adminEvents = timelineEvents.filter(
    (event) =>
      event.category === "admin" ||
      event.category === "legal" ||
      event.category === "document"
  ).length;

  return (
    <div className={styles.page}>
      {/* =========================================
          NAVIGATION
      ========================================= */}
      <div style={{ marginBottom: '16px' }}>
        <RecordTabs recordId={recordId} />
      </div>

      {/* =========================================
          HEADER
      ========================================= */}

      <header className={styles.header}>
        <div>

          <div className={styles.titleRow}>
            <h1>Ownership Timeline</h1>

            <span className={styles.parcelBadge}>
              {parcel.id}
            </span>
          </div>

          <p>
            Survey {parcel.surveyNumber}
            {" · "}
            {parcel.village?.name || "Unknown village"}
            {" · "}
            {parcel.village?.district || "Unknown district"}
          </p>
        </div>

        <div className={styles.currentOwner}>
          <span>Current Recorded Owner</span>

          <strong>
            {parcel.currentRecordedOwner ||
              parcel.owner?.name ||
              "Unknown"}
          </strong>
        </div>
      </header>

      {/* =========================================
          SUMMARY
      ========================================= */}

      <section className={styles.summaryGrid}>
        <StatCard
          icon={History}
          label="Timeline Events"
          value={timelineEvents.length}
          subtext="Combined record history"
        />

        <StatCard
          icon={User}
          label="Ownership Events"
          value={ownershipEvents}
          subtext="Ownership-related records"
        />

        <StatCard
          icon={GitBranch}
          label="Transactions"
          value={transactionEvents}
          subtext="Registration and mutation"
        />

        <StatCard
          icon={FileText}
          label="Legal Updates"
          value={adminEvents}
          subtext="Court orders & statuses"
        />
      </section>

      {/* =========================================
          CURRENT POSITION
      ========================================= */}

      <section className={styles.positionCard}>
        <div className={styles.positionIcon}>
          <ShieldCheck size={20} />
        </div>

        <div className={styles.positionContent}>

          <h2>
            {parcel.currentRecordedOwner ||
              parcel.owner?.name ||
              "Unknown Owner"}
          </h2>

          <p>
            Survey {parcel.surveyNumber} · Khata{" "}
            {parcel.khataNumber || "—"} ·{" "}
            {Number(parcel.recordedArea || 0).toFixed(2)} ha
          </p>
        </div>

        <div className={styles.positionDate}>
          <span>Latest event</span>

          <strong>
            {latestEvent
              ? formatDate(latestEvent.date)
              : "—"}
          </strong>
        </div>
      </section>

      {/* =========================================
          TIMELINE
      ========================================= */}

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2>Record History</h2>
          </div>

          <History size={18} />
        </div>

        {timelineEvents.length > 0 ? (
          <div className={styles.timeline}>
            {timelineEvents.map((event, index) => (
              <TimelineEvent
                key={event.id}
                event={event}
                isLatest={index === 0}
                isFirst={index === timelineEvents.length - 1}
                onDocumentClick={(documentId) => {
                  router.push(
                    `/documents/${documentId}`
                  );
                }}
              />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            No timeline events are available for this parcel.
          </div>
        )}
      </section>

      {/* =========================================
          OWNERSHIP FLOW
      ========================================= */}

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2>Ownership Flow</h2>
          </div>

          <ArrowRight size={18} />
        </div>

        <OwnershipFlow
          events={timelineEvents}
          currentOwner={
            parcel.currentRecordedOwner ||
            parcel.owner?.name
          }
        />
      </section>


    </div>
  );
}



/* =========================================
   TIMELINE EVENT
========================================= */

function TimelineEvent({
  event,
  isLatest,
  isFirst,
  onDocumentClick,
}) {
  const icon = getEventIcon(event.category);

  const Icon = icon.component;

  return (
    <article
      className={`${styles.timelineEvent} ${
        isLatest ? styles.latestEvent : ""
      }`}
    >
      {/* Line */}
      <div className={styles.timelineRail}>
        <div
          className={`${styles.timelineDot} ${
            styles[`dot${event.category}`]
          }`}
        >
          <Icon size={14} />
        </div>

        {!isFirst && <div className={styles.timelineLine} />}
      </div>

      {/* Content */}
      <div className={styles.eventContent}>
        <div className={styles.eventTop}>
          <div>
            <span className={styles.eventDate}>
              {formatDate(event.date)}
            </span>

            <h3>{event.title}</h3>
          </div>

          <span
            className={`${styles.categoryBadge} ${
              styles[`category${event.category}`]
            }`}
          >
            {getCategoryLabel(event.category)}
          </span>
        </div>

        <p className={styles.eventDescription}>
          {event.description}
        </p>

        {/* Ownership transfer */}
        {(event.previousOwner || event.owner) && (
          <div className={styles.ownerTransfer}>
            {event.previousOwner ? (
              <div className={styles.ownerBox}>
                <span>Previous Owner</span>
                <strong>{event.previousOwner}</strong>
              </div>
            ) : (
              <div className={styles.ownerBox}>
                <span>Record Position</span>
                <strong>Initial Record</strong>
              </div>
            )}

            {event.previousOwner && event.owner && (
              <div className={styles.transferArrow}>
                <ArrowRight size={15} />
              </div>
            )}

            {event.owner && (
              <div className={styles.ownerBox}>
                <span>New / Recorded Owner</span>
                <strong>{event.owner}</strong>
              </div>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className={styles.eventMeta}>
          {event.status && (
            <span>
              Status:
              <strong>{formatStatus(event.status)}</strong>
            </span>
          )}

          {event.metadata && (
            <span>
              {event.category === "document"
                ? "Language:"
                : "Reference:"}{" "}
              <strong>{event.metadata}</strong>
            </span>
          )}

          {event.documentId && (
            <button
              type="button"
              className={styles.documentLink}
              onClick={() =>
                onDocumentClick(event.documentId)
              }
            >
              <FileText size={12} />
              View source document
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/* =========================================
   OWNERSHIP FLOW
========================================= */

function OwnershipFlow({ events, currentOwner }) {
  const flow = [];

  events
    .filter(
      (event) =>
        event.previousOwner ||
        event.owner
    )
    .reverse()
    .forEach((event) => {
      if (
        event.previousOwner &&
        !flow.includes(event.previousOwner)
      ) {
        flow.push(event.previousOwner);
      }

      if (
        event.owner &&
        !flow.includes(event.owner)
      ) {
        flow.push(event.owner);
      }
    });

  if (
    currentOwner &&
    !flow.includes(currentOwner)
  ) {
    flow.push(currentOwner);
  }

  if (flow.length === 0) {
    return (
      <div className={styles.empty}>
        Ownership transfer information is not available.
      </div>
    );
  }

  return (
    <div className={styles.flow}>
      {flow.map((owner, index) => (
        <div
          key={`${owner}-${index}`}
          className={styles.flowItem}
        >
          <div className={styles.flowNode}>
            <User size={16} />

            <strong>{owner}</strong>

            {index === flow.length - 1 && (
              <span>Current</span>
            )}
          </div>

          {index < flow.length - 1 && (
            <div className={styles.flowArrow}>
              <ArrowRight size={17} />
          </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* =========================================
   HELPERS
========================================= */

function buildOwnershipDescription(item) {
  const owner =
    item.owner ||
    item.ownerName ||
    item.toOwner ||
    item.newOwner;

  const previousOwner =
    item.previousOwner ||
    item.fromOwner ||
    item.seller;

  if (previousOwner && owner) {
    return `Ownership position changed from ${previousOwner} to ${owner}.`;
  }

  if (owner) {
    return "";
  }

  return "";
}

function normalizeDate(value) {
  if (!value) return "";

  if (
    typeof value === "number" &&
    String(value).length === 4
  ) {
    return `${value}-01-01`;
  }

  if (
    typeof value === "string" &&
    /^\d{4}$/.test(value)
  ) {
    return `${value}-01-01`;
  }

  return value;
}

function formatDate(value) {
  if (!value) return "Unknown date";

  const normalized = normalizeDate(value);

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatStatus(value) {
  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function getCategoryLabel(category) {
  const labels = {
    ownership: "OWNERSHIP",
    transaction: "TRANSACTION",
    mutation: "MUTATION",
    document: "DOCUMENT",
  };

  return labels[category] || "RECORD";
}

function getEventIcon(category) {
  const icons = {
    ownership: {
      component: User,
    },
    transaction: {
      component: ArrowRight,
    },
    mutation: {
      component: GitBranch,
    },
    document: {
      component: FileText,
    },
  };

  return (
    icons[category] || {
      component: History,
    }
  );
}

function InfoIcon() {
  return <Clock3 size={16} />;
}
