"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  FileText,
  Map,
  GitBranch,
  History,
  ShieldAlert,
  Activity,
  Download,
} from "lucide-react";
import styles from "./RecordTabs.module.css";

const tabs = [
  { label: "Overview", icon: Activity, path: "" },
  { label: "Evidence Viewer", icon: FileText, path: "evidence" },
  { label: "Validation", icon: ShieldAlert, path: "validation" },
  { label: "Timeline", icon: History, path: "timeline" },
  { label: "GIS", icon: Map, path: "gis" },
  { label: "Evidence Graph", icon: GitBranch, path: "graph" },
];

export default function RecordTabs({ recordId }) {
  const router = useRouter();
  const pathname = usePathname();

  const segments = pathname.split("/");
  // Expected paths: /records/[id]/[tab] -> active is segments[3]
  const activeParam = segments.length > 3 ? segments[3] : "";

  return (
    <div className={styles.tabContainer}>
      <nav className={styles.tabs}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeParam === tab.path;

          return (
            <button
              key={tab.label}
              type="button"
              className={isActive ? styles.activeTab : styles.tab}
              onClick={() => {
                const navPath = tab.path ? `/records/${recordId}/${tab.path}` : `/records/${recordId}`;
                router.push(navPath);
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <a href={`/api/v1/parcels/${encodeURIComponent(recordId)}/export`} className={styles.downloadBtn}>
        <Download size={14} />
        Download Evidence Bundle
      </a>
    </div>
  );
}
