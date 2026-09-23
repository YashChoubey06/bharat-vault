"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  FileText,
  AlertTriangle,
  ClipboardCheck,
  TrendingUp,
  ArrowRight,
  Activity,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldAlert,
  Search,
  Sparkles,
  Layers,
  Building2,
  Globe,
  MapPin,
  RefreshCw,
} from "lucide-react";

import { getDashboardStats } from "@/services/api/dashboard";
import { getVerificationCases } from "@/services/api/verification";
import { getAuditLogs } from "@/services/api/audit";

import HeroBanner from "@/components/ui/HeroBanner";
import StatCard from "@/components/ui/StatCard";
import Button from "@/components/ui/Button";
import AdminFilterBar from "@/components/dashboard/AdminFilterBar";
import DilrmpProgressCard from "@/components/dashboard/DilrmpProgressCard";
import SystemHealthWidget from "@/components/dashboard/SystemHealthWidget";
import SpatialRiskOverview from "@/components/dashboard/SpatialRiskOverview";
import styles from "./page.module.css";

/* -------------------------------------------------------------------------- */
/* Custom Count-Up Animation Hook                                             */
/* -------------------------------------------------------------------------- */
function useCountUp(endValue, duration = 600) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (endValue === null || endValue === undefined) return;
    const target =
      typeof endValue === "number"
        ? endValue
        : parseInt(String(endValue).replace(/,/g, ""), 10) || 0;

    if (target === 0) {
      setCount(0);
      return;
    }

    let startTimestamp = null;
    let animationFrameId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeProgress * target));

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [endValue, duration]);

  return count;
}

/* -------------------------------------------------------------------------- */
/* Animated Risk Distribution Bar Component                                   */
/* -------------------------------------------------------------------------- */
function AnimatedRiskBar({ label, riskKey, count, total, tone, onSelect }) {
  const [barWidth, setBarWidth] = useState(0);
  const animatedCount = useCountUp(count, 600);

  const maxShare = total > 0 ? (count / total) * 100 : 0;
  const targetPercent = count > 0 ? Math.max(Math.min(maxShare * 1.8, 100), 8) : 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      setBarWidth(targetPercent);
    }, 60);
    return () => clearTimeout(timer);
  }, [targetPercent]);

  return (
    <div
      className={`${styles.riskBarCard} ${styles[tone]}`}
      onClick={() => onSelect(riskKey)}
      role="button"
      tabIndex={0}
      title={`Click to view filtered ${label} Risk records`}
    >
      <div className={styles.riskBarMeta}>
        <div className={styles.riskBarTitle}>
          <span className={`${styles.riskDot} ${styles[`dot_${tone}`]}`} />
          <strong>{label}</strong>
        </div>

        <div className={styles.riskBarCountGroup}>
          <span className={styles.riskBarCount}>
            {animatedCount.toLocaleString()}
          </span>
          <span className={styles.riskBarHint}>Filter records →</span>
        </div>
      </div>

      <div className={styles.riskBarTrack}>
        <div
          className={`${styles.riskBarFill} ${styles[`fill_${tone}`]}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Dashboard Content Inner Component                                          */
/* -------------------------------------------------------------------------- */
function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initial administrative scope from URL query parameters
  const [scope, setScope] = useState(() => {
    const st = searchParams.get("state") || "";
    const dst = searchParams.get("district") || "";
    const ths = searchParams.get("tehsil") || "";

    const level = ths
      ? "TEHSIL"
      : dst
      ? "DISTRICT"
      : st
      ? "STATE"
      : "ALL_INDIA";

    return {
      level,
      state: st,
      district: dst,
      tehsil: ths,
    };
  });

  const [data, setData] = useState({
    totalRecords: 0,
    reviewRequired: 0,
    highRisk: 0,
    verifiedRecords: 0,
    criticalRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    recordHealth: 0,
    processedRecords: 0,
    processingToday: 0,
    averageProcessingTime: "Unavailable",
    dilrmpProgress: null,
  });

  const [cases, setCases] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Sync Scope with URL parameters
  const updateScope = useCallback(
    (newScope) => {
      setScope(newScope);

      const params = new URLSearchParams();
      if (newScope.state) params.set("state", newScope.state);
      if (newScope.district) params.set("district", newScope.district);
      if (newScope.tehsil) params.set("tehsil", newScope.tehsil);

      const queryString = params.toString() ? `?${params.toString()}` : "";
      router.replace(`/dashboard${queryString}`, { scroll: false });
    },
    [router]
  );

  // Fetch scoped data on scope change
  useEffect(() => {
    async function loadScopedData() {
      try {
        setLoading(true);
        setError("");

        const [statsData, verificationData, auditData] = await Promise.all([
          getDashboardStats(scope), getVerificationCases(scope), getAuditLogs(scope),
        ]);
        if (statsData) {
          setData({
            totalRecords: statsData.totalRecords ?? 0,
            reviewRequired: statsData.reviewRequired ?? 0,
            highRisk: statsData.highRisk ?? 0,
            verifiedRecords: statsData.verifiedRecords ?? 0,
            criticalRisk: statsData.riskDistribution?.critical ?? statsData.criticalRisk ?? 0,
            mediumRisk: statsData.riskDistribution?.medium ?? statsData.mediumRisk ?? 0,
            lowRisk: statsData.riskDistribution?.low ?? statsData.lowRisk ?? 0,
            recordHealth: statsData.recordHealth ?? 0,
            processedRecords: statsData.processedRecords ?? 0,
            processingToday: statsData.processingToday ?? 0,
            averageProcessingTime: statsData.averageProcessingTime || "Unavailable",
            dilrmpProgress: statsData.dilrmpProgress || statsData.dilrmp_progress || null,
          });
        }



        setCases(verificationData || []);



        setAuditLogs(auditData ? auditData.slice(0, 4) : []);
      } catch (err) {
        console.error("Error loading scoped dashboard data:", err);
        setError(err.message || "Failed to load scoped dashboard statistics.");
      } finally {
        setLoading(false);
      }
    }

    loadScopedData();
  }, [scope]);

  function handleNavigateRisk(riskCategory) {
    const params = new URLSearchParams();
    params.set("risk", riskCategory.toUpperCase());
    if (scope.state) params.set("state", scope.state);
    if (scope.district) params.set("district", scope.district);
    if (scope.tehsil) params.set("tehsil", scope.tehsil);

    router.push(`/records?${params.toString()}`);
  }

  const criticalCount = data.criticalRisk || 0;
  const highCount = data.highRisk || 0;
  const mediumCount = data.mediumRisk || 0;
  const lowCount = data.lowRisk || 0;
  const totalRiskCount = criticalCount + highCount + mediumCount + lowCount;

  const animTotalRecords = useCountUp(data.totalRecords);
  const animPending = useCountUp(data.reviewRequired);
  const animHighRisk = useCountUp(data.highRisk);
  const animVerified = useCountUp(data.verifiedRecords);

  const activeScopeTitle = scope.tehsil
    ? `${scope.tehsil} Tehsil`
    : scope.district
    ? `${scope.district} District`
    : scope.state
    ? `${scope.state} State`
    : "Accessible records";

  return (
    <div className={styles.page}>
      {error && (
        <div className={styles.errorAlert} role="alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <HeroBanner
        eyebrow={`LAND RECORD INTELLIGENCE ENGINE • ${activeScopeTitle.toUpperCase()}`}
        title={`Good Morning, Officer`}
        subtitle={`Real-time evidence reconciliation & continuous Vault surveillance for ${activeScopeTitle}`}
        stats={[
          { label: "Surveillance Active", value: data.totalRecords.toLocaleString() },
          { label: "Record Health", value: `${data.recordHealth}%` },
        ]}
      />

      {/* COMPACT HIERARCHICAL ADMINISTRATIVE FILTER BAR */}
      <AdminFilterBar scope={scope} onChangeScope={updateScope} />

      {/* LOADING OVERLAY STATE */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#eef2ff", border: "1px solid #c7d2fe", color: "#4338ca", padding: "8px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, marginBottom: "16px" }}>
          <RefreshCw size={14} className="animate-spin" />
          <span>Loading metrics for {activeScopeTitle}...</span>
        </div>
      )}

      {/* Metric Cards Grid */}
      <section className={styles.kpiGrid}>
        <StatCard
          category="PENDING VERIFICATION"
          value={animPending.toLocaleString()}
          subtext={`Requires officer evidence check in ${activeScopeTitle}`}
          trend="Action Required"
          trendTone="amber"
          categoryTone="amber"
          icon={ClipboardCheck}
        />

        <StatCard
          category="HIGH RISK PARCELS"
          value={animHighRisk.toLocaleString()}
          subtext="Boundary or area conflicts"
          trend="Current"
          trendTone="rose"
          categoryTone="rose"
          icon={AlertTriangle}
        />

        <StatCard
          category="TOTAL RECORDS"
          value={animTotalRecords.toLocaleString()}
          subtext={`Digitized land parcels in ${activeScopeTitle}`}
          trend="Current"
          trendTone="emerald"
          categoryTone="blue"
          icon={FileText}
        />

        <StatCard
          category="VERIFIED RECORDS"
          value={animVerified.toLocaleString()}
          subtext="Fully reconciled & verified"
          trend="Current"
          trendTone="emerald"
          categoryTone="emerald"
          icon={ShieldCheck}
        />
      </section>

      {/* SPATIAL & RISK OVERVIEW COMPONENT */}
      <section style={{ marginBottom: "24px" }}>
        <SpatialRiskOverview scope={scope} onChangeScope={updateScope} />
      </section>

      {/* Main Content Layout Grid */}
      <section className={styles.mainLayoutGrid}>
        {/* Verification Queue Panel */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div>
              <div className={styles.panelTitleRow}>
                <h2>Verification Queue</h2>
                <span className={styles.queueCountBadge}>
                  {data.reviewRequired.toLocaleString()} PENDING
                </span>
              </div>
              <p>Records requiring officer verification in {activeScopeTitle}</p>
            </div>

            <Link href="/verification" style={{ textDecoration: "none" }}>
              <Button variant="secondary" style={{ fontSize: "12px", padding: "6px 12px" }}>
                View Queue <ArrowRight size={13} />
              </Button>
            </Link>
          </div>

          <div className={styles.queueList}>
            {cases.length === 0 ? (
              <div style={{ padding: "24px", textAnchor: "middle", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
                No pending verification cases found for {activeScopeTitle}.
              </div>
            ) : (
              cases.slice(0, 3).map((item) => (
                <div key={item.id} className={styles.queueCardItem}>
                  <div className={styles.queueCardHeader}>
                    <div className={styles.queueTitleGroup}>
                      <strong className={styles.khasraTitle}>
                        {item.parcel?.surveyNumber || item.parcelId}
                      </strong>
                      <span className={styles.ownerSubtitle}>
                        {item.parcel?.currentRecordedOwner || "Recorded Owner"} • {item.parcel?.tehsil || item.parcel?.district || activeScopeTitle}
                      </span>
                    </div>

                    <span
                      className={`${styles.riskBadge} ${
                        styles[`badge_${(item.priority || "HIGH").toLowerCase()}`]
                      }`}
                    >
                      {item.priority || "HIGH"}
                    </span>
                  </div>

                  <div className={styles.reasonTagRow}>
                    {Array.isArray(item.reason)
                      ? item.reason.map((r, i) => (
                          <span key={i} className={styles.reasonChip}>
                            • {r}
                          </span>
                        ))
                      : item.reason && (
                          <span className={styles.reasonChip}>
                            • {item.reason}
                          </span>
                        )}
                  </div>

                  <div className={styles.queueCardFooter}>
                    <span className={styles.khataText}>
                      Khata: {item.parcel?.khataNumber || "KH-782"}
                    </span>

                    <Link href={`/verification/${item.id}`} style={{ textDecoration: "none" }}>
                      <Button variant="primary" style={{ fontSize: "11px", padding: "5px 10px" }}>
                        Review Case <ArrowRight size={12} />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Risk Visualization Panel */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Risk Distribution ({activeScopeTitle})</h2>
              <p>Click any category below to open filtered land records</p>
            </div>

            <span className={styles.liveBadge}>
              <Activity size={13} />
              Scoped Filter
            </span>
          </div>

          <div className={styles.riskChartWrapper}>
            <AnimatedRiskBar
              label="Critical"
              riskKey="CRITICAL"
              count={criticalCount}
              total={totalRiskCount}
              tone="critical"
              onSelect={handleNavigateRisk}
            />

            <AnimatedRiskBar
              label="High"
              riskKey="HIGH"
              count={highCount}
              total={totalRiskCount}
              tone="high"
              onSelect={handleNavigateRisk}
            />

            <AnimatedRiskBar
              label="Medium"
              riskKey="MEDIUM"
              count={mediumCount}
              total={totalRiskCount}
              tone="medium"
              onSelect={handleNavigateRisk}
            />

            <AnimatedRiskBar
              label="Low"
              riskKey="LOW"
              count={lowCount}
              total={totalRiskCount}
              tone="low"
              onSelect={handleNavigateRisk}
            />
          </div>

          <div className={styles.riskFooterHint}>
            <span>💡 Tip: Clicking a bar opens filtered records in Land Records workspace</span>
          </div>
        </div>
      </section>

      {/* Bottom 2x2 Layout Section */}
      <section className={styles.bottomLayoutGrid}>
        {/* 1. Recent Activity Feed */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Recent Activity ({activeScopeTitle})</h2>
              <p>Latest evidence reconciliation & verification actions</p>
            </div>

            <Link href="/audit" style={{ textDecoration: "none" }}>
              <Button variant="ghost" style={{ fontSize: "12px", padding: "6px 12px" }}>
                Full Audit Trail <ArrowRight size={13} />
              </Button>
            </Link>
          </div>

          <div className={styles.activityTimeline}>
            {auditLogs.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
                No recent activity recorded for {activeScopeTitle}.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className={styles.timelineItem}>
                  <div className={styles.timelineMarker} />
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineTitleRow}>
                      <strong>{log.action}</strong>
                      <span className={styles.timelineTime}>
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className={styles.timelineDesc}>{log.description}</p>
                    <span className={styles.timelineUser}>{log.user}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. System Health & Integration Status Widget */}
        <SystemHealthWidget />

        {/* 3. DILRMP Digitization & Integration Progress Card */}
        <DilrmpProgressCard
          progressData={data.dilrmpProgress}
          scopeLabel={activeScopeTitle}
        />

        {/* 4. Processing Performance Breakdown */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Processing Performance</h2>
              <p>System throughput & verification engine metrics for {activeScopeTitle}</p>
            </div>
            <Sparkles size={16} className={styles.accentIcon} />
          </div>

          <div className={styles.performanceMetricBox}>
            <div className={styles.healthDisplay}>
              <div className={styles.healthScoreText}>
                <strong>{data.recordHealth}%</strong>
                <span>Record Health Score</span>
              </div>
              <p className={styles.healthSub}>
                Percentage of records in {activeScopeTitle} meeting full cross-verification standards
              </p>
            </div>

            <div className={styles.perfGrid}>
              <div className={styles.perfCard}>
                <span>Processed Today</span>
                <strong>{data.processingToday.toLocaleString()}</strong>
              </div>

              <div className={styles.perfCard}>
                <span>Avg Verification Speed</span>
                <strong>{data.averageProcessingTime}</strong>
              </div>

              <div className={styles.perfCard}>
                <span>Clean Records</span>
                <strong>{data.verifiedRecords.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: "40px", textAlign: "center", color: "#475569", fontSize: "14px" }}>
        Loading dashboard administrative scope...
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
