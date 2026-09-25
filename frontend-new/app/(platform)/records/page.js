"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  FileText,
  ChevronRight,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  RefreshCw,
  FolderOpen,
} from "lucide-react";

import { getDocuments } from "@/services/api/documents";
import { getParcels } from "@/services/api/parcels";
import styles from "./records.module.css";

// Generate evidence records from parcel intelligence data
function buildEvidenceRecords(parcelsList, documents) {
  return documents.map(doc => {
    const p = parcelsList.find(p => p.id === doc.parcelId) || {};
    return {id:doc.id, type:doc.documentType, parcelId:doc.parcelId, surveyNumber:p.surveyNumber || "",
      sourceDept:"Local document upload", documentRef:doc.fileName || doc.id, owner:p.currentRecordedOwner || "",
      area:p.recordedArea == null ? "—" : `${p.recordedArea} ha`, date:doc.uploadedAt,
      status:doc.ocrStatus === "COMPLETED" ? p.recordStatus : doc.ocrStatus};
  });
}

function RecordsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("type");

  const [documents, setDocuments] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(initialFilter || "ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadParcels() {
      try {
        setLoading(true);
        setError("");
        const [data, docs] = await Promise.all([getParcels(), getDocuments()]);
        setParcels(data); setDocuments(docs);
      } catch (err) {
        setError(err.message || "Unable to load record registry.");
      } finally {
        setLoading(false);
      }
    }
    loadParcels();
  }, []);

  const allRecords = useMemo(() => buildEvidenceRecords(parcels, documents), [parcels, documents]);

  const recordTypes = useMemo(() => {
    return [...new Set(allRecords.map((r) => r.type))];
  }, [allRecords]);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();

    return allRecords.filter((record) => {
      const matchesSearch =
        !term ||
        record.id.toLowerCase().includes(term) ||
        record.parcelId.toLowerCase().includes(term) ||
        record.surveyNumber.toLowerCase().includes(term) ||
        record.owner.toLowerCase().includes(term) ||
        record.documentRef.toLowerCase().includes(term);

      const matchesType = typeFilter === "ALL" || record.type === typeFilter;
      const matchesStatus = statusFilter === "ALL" || record.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [allRecords, search, typeFilter, statusFilter]);

  function clearFilters() {
    setSearch("");
    setTypeFilter("ALL");
    setStatusFilter("ALL");
  }

  function openRecordDetail(parcelId) {
    router.push(`/records/${parcelId}`);
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1>Evidence Records</h1>
        </div>

        <div className={styles.headerMeta}>
          <div className={styles.recordCount}>
            <span>Indexed Records</span>
            <strong>{allRecords.length}</strong>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className={styles.filterCard}>
        <div className={styles.searchBox}>
          <Search size={17} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Record ID, Document Ref, Parcel, Owner or Survey #..."
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className={styles.clearSearch}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className={styles.filters}>
          <div className={styles.filterItem}>
            <SlidersHorizontal size={14} />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Record Types</option>
              {recordTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterItem}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="REVIEW_REQUIRED">Review Required</option>
            </select>
          </div>

          {(search || typeFilter !== "ALL" || statusFilter !== "ALL") && (
            <button
              type="button"
              className={styles.clearFilters}
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Results summary */}
      <div className={styles.resultsBar}>
        <div>
          Showing <strong>{filteredRecords.length}</strong> of {allRecords.length} evidence records
        </div>

      </div>

      {/* Loading */}
      {loading && (
        <div className={styles.stateCard}>
          <RefreshCw size={20} className={styles.spinner} />
          <span>Loading record registry...</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className={styles.errorCard}>
          <AlertTriangle size={20} />
          <div>
            <strong>Unable to load record registry</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filteredRecords.length === 0 && (
        <div className={styles.emptyCard}>
          <FolderOpen size={24} />
          <h3>No evidence records found</h3>
          <p>Try changing your search term or clearing the active filters.</p>
          <button type="button" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      )}

      {/* Desktop table */}
      {!loading && !error && filteredRecords.length > 0 && (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table>
              <thead>
                <tr>
                  <th>Record ID</th>
                  <th>Record Type</th>
                  <th>Target Parcel</th>
                  <th>Source Dept</th>
                  <th>Doc Reference</th>
                  <th>Recorded Owner</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((rec) => (
                  <tr
                    key={rec.id}
                    onClick={() => openRecordDetail(rec.parcelId)}
                  >
                    {/* Record ID */}
                    <td>
                      <div className={styles.parcelCell}>
                        <strong>{rec.id}</strong>
                      </div>
                    </td>

                    {/* Type */}
                    <td>
                      <div className={styles.typeCell}>
                        <FileText size={14} />
                        <span>{rec.type}</span>
                      </div>
                    </td>

                    {/* Target Parcel */}
                    <td>
                      <div className={styles.locationCell}>
                        <strong>{rec.parcelId}</strong>
                        <span>Survey {rec.surveyNumber}</span>
                      </div>
                    </td>

                    {/* Source Dept */}
                    <td>{rec.sourceDept}</td>

                    {/* Doc Reference */}
                    <td>
                      <code className={styles.docCode}>{rec.documentRef}</code>
                    </td>

                    {/* Owner */}
                    <td>
                      <div className={styles.ownerCell}>{rec.owner}</div>
                    </td>

                    {/* Date */}
                    <td>{rec.date}</td>

                    {/* Status */}
                    <td>
                      <StatusBadge status={rec.status} />
                    </td>

                    {/* Action */}
                    <td>
                      <button
                        type="button"
                        className={styles.viewButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          openRecordDetail(rec.parcelId);
                        }}
                        aria-label={`Open ${rec.parcelId}`}
                      >
                        <ChevronRight size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecordsPage() {
  return (
    <Suspense fallback={<div>Loading record registry...</div>}>
      <RecordsContent />
    </Suspense>
  );
}

function StatusBadge({ status }) {
  const labels = {
    VERIFIED: "Verified",
    REVIEW_REQUIRED: "Review Required",
    PROCESSING: "Processing",
  };

  return (
    <span
      className={`${styles.statusBadge} ${
        styles[`status${status}`] || ""
      }`}
    >
      {status === "VERIFIED" ? (
        <CheckCircle2 size={12} />
      ) : (
        <AlertTriangle size={12} />
      )}
      {labels[status] || status}
    </span>
  );
}
