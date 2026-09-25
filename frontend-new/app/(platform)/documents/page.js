"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Upload,
  FileText,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  MoreVertical,
  ChevronRight,
  Filter,
} from "lucide-react";

import StatCard from "@/components/ui/StatCard";
import { getDocuments } from "@/services/api/documents";
import styles from "./documents.module.css";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusMeta(status) {
  const normalized = String(status || "").toUpperCase();

  if (
    normalized.includes("COMPLETE") ||
    normalized.includes("VERIFIED") ||
    normalized.includes("SUCCESS")
  ) {
    return {
      label: status || "Completed",
      className: styles.statusSuccess,
      icon: CheckCircle2,
    };
  }

  if (
    normalized.includes("PROCESS") ||
    normalized.includes("PENDING") ||
    normalized.includes("REVIEW")
  ) {
    return {
      label: status || "Processing",
      className: styles.statusPending,
      icon: Clock3,
    };
  }

  if (
    normalized.includes("ERROR") ||
    normalized.includes("FAILED") ||
    normalized.includes("REJECT")
  ) {
    return {
      label: status || "Attention Required",
      className: styles.statusDanger,
      icon: AlertTriangle,
    };
  }

  return {
    label: status || "Available",
    className: styles.statusNeutral,
    icon: FileText,
  };
}

export default function DocumentsPage() {
  const router = useRouter();

  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDocuments() {
    try {
      setLoading(true);
      setError("");

      const data = await getDocuments();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  const stats = useMemo(() => {
    const total = documents.length;

    const completed = documents.filter((item) => {
      const status = String(
        item.ocrStatus || item.status || ""
      ).toUpperCase();

      return (
        status.includes("COMPLETE") ||
        status.includes("VERIFIED") ||
        status.includes("SUCCESS")
      );
    }).length;

    const processing = documents.filter((item) => {
      const status = String(
        item.ocrStatus || item.status || ""
      ).toUpperCase();

      return (
        status.includes("PROCESS") ||
        status.includes("PENDING") ||
        status.includes("REVIEW")
      );
    }).length;

    const attention = documents.filter((item) => {
      const status = String(
        item.ocrStatus || item.status || ""
      ).toUpperCase();

      return (
        status.includes("ERROR") ||
        status.includes("FAILED") ||
        status.includes("REJECT")
      );
    }).length;

    return {
      total,
      completed,
      processing,
      attention,
    };
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return documents.filter((document) => {
      const status = String(
        document.ocrStatus || document.status || ""
      ).toUpperCase();

      const searchableText = [
        document.id,
        document.documentNumber,
        document.documentType,
        document.type,
        document.title,
        document.parcelId,
        document.surveyNumber,
        document.language,
        document.source,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !term || searchableText.includes(term);

      let matchesStatus = true;

      if (statusFilter === "COMPLETED") {
        matchesStatus =
          status.includes("COMPLETE") ||
          status.includes("VERIFIED") ||
          status.includes("SUCCESS");
      }

      if (statusFilter === "PROCESSING") {
        matchesStatus =
          status.includes("PROCESS") ||
          status.includes("PENDING") ||
          status.includes("REVIEW");
      }

      if (statusFilter === "ATTENTION") {
        matchesStatus =
          status.includes("ERROR") ||
          status.includes("FAILED") ||
          status.includes("REJECT");
      }

      return matchesSearch && matchesStatus;
    });
  }, [documents, search, statusFilter]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Documents</h1>
        </div>

        <button
          type="button"
          className={styles.uploadButton}
          onClick={() => router.push("/documents/upload")}
        >
          <Upload size={17} />
          Upload Document
        </button>
      </div>

      <section className={styles.statsGrid}>
        <StatCard
          icon={FileText}
          label="Total Documents"
          value={stats.total}
          variant="neutral"
        />

        <StatCard
          icon={CheckCircle2}
          label="OCR Completed"
          value={stats.completed}
          variant="success"
        />

        <StatCard
          icon={Clock3}
          label="Processing"
          value={stats.processing}
          variant="warning"
        />

        <StatCard
          icon={AlertTriangle}
          label="Review Required"
          value={stats.attention}
          variant="warning"
        />
      </section>

      <section className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={17} />

          <input
            type="text"
            placeholder="Search by document, parcel, survey number..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className={styles.filters}>
          <FilterButton
            active={statusFilter === "ALL"}
            onClick={() => setStatusFilter("ALL")}
          >
            All
          </FilterButton>

          <FilterButton
            active={statusFilter === "COMPLETED"}
            onClick={() => setStatusFilter("COMPLETED")}
          >
            Completed
          </FilterButton>

          <FilterButton
            active={statusFilter === "PROCESSING"}
            onClick={() => setStatusFilter("PROCESSING")}
          >
            Processing
          </FilterButton>

          <FilterButton
            active={statusFilter === "ATTENTION"}
            onClick={() => setStatusFilter("ATTENTION")}
          >
            Attention
          </FilterButton>
        </div>

        <button
          type="button"
          className={styles.refreshButton}
          onClick={loadDocuments}
          disabled={loading}
          title="Refresh"
        >
          <RefreshCw
            size={16}
            className={loading ? styles.spinning : ""}
          />
        </button>
      </section>

      {loading && (
        <div className={styles.stateCard}>
          <div className={styles.loader} />
          <p>Loading documents...</p>
        </div>
      )}

      {!loading && error && (
        <div className={styles.errorCard}>
          <AlertTriangle size={20} />
          <div>
            <strong>Unable to load documents</strong>
            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={loadDocuments}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <section className={styles.documentSection}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Source Documents</h2>
              <p>
                {filteredDocuments.length} document
                {filteredDocuments.length !== 1 ? "s" : ""} found
              </p>
            </div>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className={styles.emptyState}>
              <FileText size={28} />
              <h3>No documents found</h3>
              <p>
                Try changing the search term or filter.
              </p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Type</th>
                    <th>Parcel</th>
                    <th>Language</th>
                    <th>OCR Status</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDocuments.map((document) => {
                    const status = getStatusMeta(
                      document.ocrStatus || document.status
                    );

                    const StatusIcon = status.icon;

                    return (
                      <tr key={document.id}>
                        <td>
                          <div className={styles.documentCell}>
                            <div className={styles.documentIcon}>
                              <FileText size={18} />
                            </div>

                            <div>
                              <strong>
                                {document.title ||
                                  document.documentType ||
                                  document.type ||
                                  "Land Record Document"}
                              </strong>

                              <span>
                                {document.id}
                                {document.documentNumber
                                  ? ` · ${document.documentNumber}`
                                  : ""}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          {document.documentType ||
                            document.type ||
                            "—"}
                        </td>

                        <td>
                          <span className={styles.parcelId}>
                            {document.parcelId || "—"}
                          </span>
                        </td>

                        <td>
                          {document.language || "—"}
                        </td>

                        <td>
                          <span
                            className={`${styles.status} ${status.className}`}
                          >
                            <StatusIcon size={14} />
                            {status.label}
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            document.documentDate ||
                              document.date ||
                              document.createdAt
                          )}
                        </td>

                        <td>
                          <button
                            type="button"
                            className={styles.viewButton}
                            onClick={() =>
                              router.push(
                                `/documents/${document.id}`
                              )
                            }
                          >
                            View
                            <ChevronRight size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}


    </div>
  );
}



function FilterButton({ children, active, onClick }) {
  return (
    <button
      type="button"
      className={`${styles.filterButton} ${
        active ? styles.filterActive : ""
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
