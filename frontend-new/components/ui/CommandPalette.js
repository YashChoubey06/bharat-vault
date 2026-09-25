"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  FileText,
  MapPin,
  ShieldAlert,
  User,
  LayoutDashboard,
  Box,
  CheckCircle,
  FileCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { getParcels } from "@/services/api/parcels";
import { getDocuments } from "@/services/api/documents";
import styles from "./CommandPalette.module.css";

export default function CommandPalette({ isOpen, onClose }) {
  const [parcels, setParcels] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setParcels([]); setDocuments([]); setError("");
    Promise.all([getParcels(), getDocuments()]).then(([ps, docs]) => {
      if (active) { setParcels(ps); setDocuments(docs); }
    }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [isOpen]);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);


  if (!isOpen) return null;

  // Search items setup
  const q = query.toLowerCase().trim();

  // 1. Navigation items
  const quickLinks = [
    { title: "Dashboard Overview", sub: "Operational KPIs & Risk Metrics", href: "/dashboard", icon: LayoutDashboard, category: "Quick Navigation" },
    { title: "Land Records Explorer", sub: "Search & Inspect All Digitized Parcels", href: "/records", icon: Box, category: "Quick Navigation" },
    { title: "Verification Queue", sub: "Officer Human-in-the-Loop Review", href: "/verification", icon: ShieldAlert, category: "Quick Navigation" },
    { title: "Document Repository", sub: "OCR Ingestion & Provenance Documents", href: "/documents", icon: FileText, category: "Quick Navigation" },
    { title: "GIS & Cadastral Overlay", sub: "Spatial Coordinates & Boundary Inspection", href: "/parcels", icon: MapPin, category: "Quick Navigation" },
    { title: "3D Cadastral Studio", sub: "Interactive Building & Spatial Viewer", href: "/studio", icon: Sparkles, category: "Quick Navigation" },
    { title: "Audit Trail", sub: "System Audit Logs & Officer Verification History", href: "/audit", icon: FileCheck, category: "Quick Navigation" },
  ];

  // 2. Parcel results
  const parcelResults = parcels.map((p) => ({
    title: `Parcel #${p.id} (${p.surveyNumber || "RoR"})`,
    sub: `${p.village?.name || ""}, ${p.village?.district || ""} • Owner: ${p.currentRecordedOwner || "Unknown"}`,
    href: `/records/${p.id}`,
    icon: MapPin,
    category: "Land Parcels",
    tag: p.recordStatus || "Unknown",
  }));

  // 3. Document results
  const documentResults = documents.map((d) => ({
    title: d.fileName || d.id,
    sub: `Type: ${d.documentType || "Deed"} • Registered: ${d.uploadedAt || "Unknown"}`,
    href: `/documents/${d.id}`,
    icon: FileText,
    category: "Evidence Documents",
    tag: d.ocrStatus || "Unknown",
  }));

  // Filter items based on query
  const filteredQuick = quickLinks.filter(
    (item) => item.title.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q)
  );

  const filteredParcels = parcelResults.filter(
    (item) => item.title.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q)
  );

  const filteredDocs = documentResults.filter(
    (item) => item.title.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q)
  );

  const allFilteredResults = [
    ...filteredParcels.slice(0, 4),
    ...filteredDocs.slice(0, 3),
    ...filteredQuick,
  ];

  const handleSelect = (href) => {
    onClose();
    router.push(href);
  };

  const handleKeyDownInput = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, allFilteredResults.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allFilteredResults.length) % Math.max(1, allFilteredResults.length));
    } else if (e.key === "Enter" && allFilteredResults[selectedIndex]) {
      e.preventDefault();
      handleSelect(allFilteredResults[selectedIndex].href);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true" aria-label="Global Search Command Palette">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {error && <p role="alert">{error}</p>}
        <div className={styles.searchHeader}>
          <Search size={18} className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Search Khasra #, Owner name, Parcel ID, Document, or View..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDownInput}
          />
          {query ? (
            <button className={styles.clearButton} onClick={() => setQuery("")} aria-label="Clear search query">
              <X size={15} />
            </button>
          ) : (
            <span className={styles.shortcutHint}>ESC</span>
          )}
        </div>

        <div className={styles.resultsContainer}>
          {allFilteredResults.length === 0 ? (
            <div className={styles.emptyState}>
              <Search size={24} style={{ opacity: 0.4 }} />
              <p>No records, documents, or views matching &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            <div>
              {/* Parcels Group */}
              {filteredParcels.length > 0 && (
                <div className={styles.sectionGroup}>
                  <div className={styles.sectionHeader}>Land Parcels ({filteredParcels.length})</div>
                  {filteredParcels.slice(0, 4).map((item, idx) => {
                    const globalIdx = idx;
                    const isActive = globalIdx === selectedIndex;
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.href + idx}
                        className={`${styles.resultItem} ${isActive ? styles.active : ""}`}
                        onClick={() => handleSelect(item.href)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                      >
                        <div className={styles.resultLeft}>
                          <div className={styles.itemIcon}>
                            <Icon size={16} />
                          </div>
                          <div className={styles.itemDetails}>
                            <span className={styles.itemTitle}>{item.title}</span>
                            <span className={styles.itemSub}>{item.sub}</span>
                          </div>
                        </div>
                        <div className={styles.resultRight}>
                          <span className={styles.itemTag}>{item.tag}</span>
                          <ArrowRight size={14} className={styles.enterIcon} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Documents Group */}
              {filteredDocs.length > 0 && (
                <div className={styles.sectionGroup}>
                  <div className={styles.sectionHeader}>Evidence Documents ({filteredDocs.length})</div>
                  {filteredDocs.slice(0, 3).map((item, idx) => {
                    const globalIdx = filteredParcels.slice(0, 4).length + idx;
                    const isActive = globalIdx === selectedIndex;
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.href + idx}
                        className={`${styles.resultItem} ${isActive ? styles.active : ""}`}
                        onClick={() => handleSelect(item.href)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                      >
                        <div className={styles.resultLeft}>
                          <div className={styles.itemIcon}>
                            <Icon size={16} />
                          </div>
                          <div className={styles.itemDetails}>
                            <span className={styles.itemTitle}>{item.title}</span>
                            <span className={styles.itemSub}>{item.sub}</span>
                          </div>
                        </div>
                        <div className={styles.resultRight}>
                          <span className={styles.itemTag}>{item.tag}</span>
                          <ArrowRight size={14} className={styles.enterIcon} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Quick Links Group */}
              {filteredQuick.length > 0 && (
                <div className={styles.sectionGroup}>
                  <div className={styles.sectionHeader}>Platform Views</div>
                  {filteredQuick.map((item, idx) => {
                    const globalIdx = filteredParcels.slice(0, 4).length + filteredDocs.slice(0, 3).length + idx;
                    const isActive = globalIdx === selectedIndex;
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.href + idx}
                        className={`${styles.resultItem} ${isActive ? styles.active : ""}`}
                        onClick={() => handleSelect(item.href)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                      >
                        <div className={styles.resultLeft}>
                          <div className={styles.itemIcon}>
                            <Icon size={16} />
                          </div>
                          <div className={styles.itemDetails}>
                            <span className={styles.itemTitle}>{item.title}</span>
                            <span className={styles.itemSub}>{item.sub}</span>
                          </div>
                        </div>
                        <div className={styles.resultRight}>
                          <ArrowRight size={14} className={styles.enterIcon} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.footerHints}>
            <div className={styles.footerHint}>
              <span className={styles.footerKey}>↑</span>
              <span className={styles.footerKey}>↓</span>
              <span>Navigate</span>
            </div>
            <div className={styles.footerHint}>
              <span className={styles.footerKey}>↵</span>
              <span>Select</span>
            </div>
          </div>
          <div>Bharat Vault Search • Press <strong>Esc</strong> to close</div>
        </div>
      </div>
    </div>
  );
}
