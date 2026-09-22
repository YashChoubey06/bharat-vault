import {
  ShieldCheck,
  FileText,
  AlertTriangle,
  ClipboardCheck,
} from "lucide-react";

import styles from "./page.module.css";
//import AssistantPanel from "@/components/assistant/AssistantPanel";

const stats = [
  {
    label: "Total Records",
    value: "12,847",
    icon: FileText,
  },
  {
    label: "Verified",
    value: "10,942",
    icon: ShieldCheck,
  },
  {
    label: "Review Required",
    value: "532",
    icon: ClipboardCheck,
  },
  {
    label: "High Risk",
    value: "84",
    icon: AlertTriangle,
  },
];

export default function DashboardPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            LAND RECORD INTELLIGENCE
          </span>

          <h1>Verification Dashboard</h1>
          <p>
            Monitor records, evidence conflicts and
            verification workload.
          </p>
        </div>

        <div className={styles.date}>
          10 September 2026
        </div>
      </div>
      

      <section className={styles.stats}>
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              className={styles.statCard}
              key={stat.label}
            >
              <div className={styles.statIcon}>
                <Icon size={18} />
              </div>

              <div>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            </article>
          );
        })}
      </section>
      

      <section className={styles.workspace}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Priority Verification Queue</h2>
              <p>
                Records requiring officer attention.
              </p>
            </div>

            <span className={styles.badge}>
              84 HIGH RISK
            </span>
          </div>

          <div className={styles.emptyState}>
            <ClipboardCheck size={25} />

            <strong>Verification workspace</strong>

            <p>
              High-risk parcel cases will appear here
              once records are processed.
            </p>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Record Health</h2>
              <p>
                Overall quality of processed records.
              </p>
            </div>
          </div>

          <div className={styles.health}>
            <strong>87%</strong>

            <span>
              Records currently meeting verification
              quality thresholds.
            </span>
          </div>
        </div>
      </section>
    </div>
    
  );
}