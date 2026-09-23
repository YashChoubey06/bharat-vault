"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowDown, ArrowRight, BookOpen, Check, ChevronRight, FileCheck2, FileText, Fingerprint, Layers3, MapPinned, Pause, Play, ScanLine, ShieldCheck, UserRoundCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getDashboardStats } from "@/services/api/dashboard";
import styles from "./StoryExperience.module.css";

const samples = [
  { id: "ror", short: "RoR scan", type: "Record of Rights", file: "jamabandi_124-3.pdf", page: "Page 2", owner: "Suresh Kumar", area: "2.50 ha", confidence: "94%", result: "Source-linked", resultDetail: "Fields point back to the original page.", flagged: false, glyph: "अ" },
  { id: "deed", short: "Sale deed", type: "Registration deed", file: "sale_deed_124-3.pdf", page: "Page 4", owner: "Suresh Kumar", area: "2.20 ha", confidence: "92%", result: "Review required", resultDetail: "Area differs from the RoR by 0.30 ha.", flagged: true, glyph: "र" },
  { id: "mutation", short: "Mutation", type: "Mutation register", file: "mutation_124-3.png", page: "Page 1", owner: "Suresh Kumar", area: "Pending", confidence: "62%", result: "Review required", resultDetail: "Low-confidence status needs an officer.", flagged: true, glyph: "म" },
];
const phases = ["Upload", "Read", "Extract", "Compare", "Review"];
const graphNodes = [
  { id: "upload", lane: "capture", label: "Source upload", detail: "PDFs and scans enter a local, access-controlled document queue.", icon: FileText },
  { id: "records", lane: "capture", label: "Land records", detail: "RoR, registration and mutation records remain distinct sources.", icon: BookOpen },
  { id: "gis", lane: "capture", label: "GIS evidence", detail: "A parcel boundary or area is compared when a GIS source is available.", icon: MapPinned },
  { id: "ocr", lane: "reconcile", label: "OCR + field extraction", detail: "English and Hindi text becomes structured fields with confidence scores.", icon: ScanLine },
  { id: "evidence", lane: "reconcile", label: "Evidence linkage", detail: "Each field retains its document, page and highlighted source region.", icon: Fingerprint },
  { id: "compare", lane: "reconcile", label: "Cross-source checks", detail: "Area, owner and parcel identifiers are compared across available sources.", icon: Layers3 },
  { id: "review", lane: "deliver", label: "Officer review", detail: "Uncertain or conflicting values are routed to an authorized officer.", icon: UserRoundCheck },
  { id: "decision", lane: "deliver", label: "Recorded decision", detail: "Verification is an explicit human action, not an automatic OCR outcome.", icon: ShieldCheck },
  { id: "audit", lane: "deliver", label: "Audit trail", detail: "The review and decision remain traceable after the case is closed.", icon: FileCheck2 },
];

export default function StoryExperience() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [statsState, setStatsState] = useState("idle");
  useEffect(() => {
    if (authLoading) return;
    if (!user) { setStatsState("signed-out"); return; }
    let alive = true;
    setStatsState("loading");
    getDashboardStats().then(data => { if (alive) { setStats(data); setStatsState("ready"); } }).catch(() => { if (alive) setStatsState("unavailable"); });
    return () => { alive = false; };
  }, [authLoading, user]);
  return <main id="main-story" className={styles.root}>
    <section id="why" className={styles.hero} aria-labelledby="landing-title">
      <div className={styles.heroIntro}>
        <div className={styles.heroCopy}>
          <p className={styles.overline}><span /> Land records, made answerable</p>
          <h1 id="landing-title">Every land record has a story. <em>Show the evidence.</em></h1>
          <p className={styles.heroLead}>Bharat Vault reads scanned records, connects extracted facts to their source, and shows where documents disagree—so an officer can review what matters.</p>
          <div className={styles.heroActions}><Link href="/dashboard" className={styles.primaryAction}>Open the live MVP <ArrowRight size={18} aria-hidden="true" /></Link><a href="#how-it-works" className={styles.textAction}>See how it works <ArrowDown size={17} aria-hidden="true" /></a></div>
          <p className={styles.miniProof}><Check size={15} /> English + Hindi OCR <span /> Source-linked fields <span /> Human decision</p>
        </div>
        <aside className={styles.heroAside} aria-label="Illustrative parcel context"><small>EXAMPLE PARCEL</small><strong>Survey 124/3</strong><span>Rampura, Kota</span><div /><p><span>RoR area</span><b>2.50 ha</b></p><p><span>Deed area</span><b>2.20 ha</b></p><label><AlertTriangle size={14} /> Difference surfaced for review</label></aside>
      </div>
      <Conveyor />
    </section>
    <section className={styles.summary} aria-labelledby="summary-title"><header className={styles.summaryHeading}><p className={styles.sectionTag}>The work behind a decision</p><h2 id="summary-title">One record. Several sources. A traceable conclusion.</h2><p>Follow a source from upload to review. Select any step to see what Bharat Vault actually does there.</p></header><ProjectGraph /></section>
    <section id="how-it-works" className={styles.evidenceSection} aria-labelledby="evidence-title"><div className={styles.evidenceCopy}><p className={styles.sectionTag}>Source before conclusion</p><h2 id="evidence-title">Click a field. See exactly where it came from.</h2><p>OCR confidence is a clue, not a verdict. The Evidence Viewer keeps the extracted value beside the original page and marks uncertain text for an officer to inspect.</p><Link href="/records" className={styles.outlineAction}>Explore land records <ChevronRight size={18} aria-hidden="true" /></Link></div><EvidencePreview /></section>
    <section id="proof" className={styles.closing} aria-labelledby="closing-title"><div><p className={styles.sectionTag}>Human judgment stays in the loop</p><h2 id="closing-title">The system finds the discrepancy. An officer makes the decision.</h2><p>Upload a synthetic sample, inspect its source evidence, and follow the validation trail in the local workspace.</p>{statsState === "ready" && stats && <span className={styles.liveCount}>Local workspace now: {stats.totalRecords} parcels, {stats.totalDocuments} documents, {stats.reviewRequired} awaiting review.</span>}{statsState === "loading" && <span className={styles.liveCount} role="status">Loading local workspace totals…</span>}</div><Link href="/dashboard" className={styles.primaryAction}>Open Bharat Vault <ArrowRight size={18} aria-hidden="true" /></Link></section>
  </main>;
}

function Conveyor() {
  const [selected, setSelected] = useState(0);
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(true);
  const beltRef = useRef(null);
  const sample = samples[selected];
  useEffect(() => { const media = window.matchMedia("(prefers-reduced-motion: reduce)"); const stopForMotion = () => { if (media.matches) setPlaying(false); }; stopForMotion(); media.addEventListener?.("change", stopForMotion); return () => media.removeEventListener?.("change", stopForMotion); }, []);
  useEffect(() => { if (!beltRef.current) return; const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .08 }); observer.observe(beltRef.current); return () => observer.disconnect(); }, []);
  useEffect(() => { if (!playing || !visible) return; const timer = window.setInterval(() => setPhase(current => (current + 1) % phases.length), 2100); return () => window.clearInterval(timer); }, [playing, visible]);
  const chooseSample = index => { setSelected(index); setPhase(0); };
  return <div ref={beltRef} className={`${styles.conveyor} ${playing && visible ? styles.isPlaying : ""}`} aria-label="Illustrative document processing flow">
    <div className={styles.conveyorBar}><div className={styles.conveyorHeading}><span className={styles.liveDot} /> Evidence processing line <span className={styles.demoTag}>ILLUSTRATIVE DEMO</span></div><button type="button" className={styles.playControl} onClick={() => setPlaying(current => !current)} aria-label={playing ? "Pause conveyor animation" : "Play conveyor animation"}>{playing ? <Pause size={15} /> : <Play size={15} />}{playing ? "Pause" : "Play"}</button></div>
    <div className={styles.sampleSelector} role="group" aria-label="Choose a sample document">{samples.map((item, index) => <button key={item.id} type="button" onClick={() => chooseSample(index)} aria-pressed={selected === index} className={selected === index ? styles.sampleActive : ""}><FileText size={16} aria-hidden="true" /> {item.short}</button>)}</div>
    <div className={styles.beltWorld}>
      <div className={styles.beltTrack} aria-hidden="true" />
      <div className={styles.transferSheet} aria-hidden="true"><FileText size={18} /><span>PDF</span><b><Check size={11} /> TRACED</b></div>
      <div className={styles.sourceDeck}><span className={styles.zoneLabel}>INPUT / SOURCE</span><div className={styles.paperShadow} aria-hidden="true" /><div className={styles.sourcePaper}><div className={styles.paperTop}><span>{sample.glyph}</span><small>SCANNED RECORD</small></div><strong>{sample.type}</strong><i /><i /><i /><i /><p>Survey 124/3</p><small>{sample.file}</small></div></div>
      <div className={styles.station}><div className={styles.stationTop}><ScanLine size={16} /> BHARAT VAULT <span /></div><div className={styles.stationScreen} aria-live="off"><small>{phases[phase]} / {sample.page}</small><strong>{phase < 2 ? "Reading the source" : phase === 2 ? "Fields extracted" : phase === 3 ? "Sources compared" : "Ready for officer"}</strong><div className={styles.screenFields}><span>Owner <b>{sample.owner}</b></span><span>{sample.id === "mutation" ? "Status" : "Area"} <b>{sample.area}</b></span><span>Confidence <b>{sample.confidence}</b></span></div></div><div className={styles.stationFoot}><span>LOCAL OCR</span><span>EVIDENCE-LINKED</span><span>REVIEWABLE</span></div></div>
      <div className={styles.outputDeck}><span className={styles.zoneLabel}>OUTPUT / DECISION SUPPORT</span><div className={`${styles.outputPaper} ${sample.flagged ? styles.outputFlagged : ""}`}><div className={styles.outputIcon}>{sample.flagged ? <AlertTriangle size={19} /> : <FileCheck2 size={19} />}</div><small>PARCEL PRC-001</small><strong>{sample.result}</strong><p>{sample.resultDetail}</p><span className={styles.sourceRef}>{sample.file} · {sample.page}</span></div></div>
    </div>
    <div className={styles.phaseRail} role="group" aria-label="Processing steps">{phases.map((step, index) => <button key={step} type="button" aria-pressed={phase === index} onClick={() => { setPhase(index); setPlaying(false); }} className={phase === index ? styles.phaseActive : ""}><span>{index + 1}</span>{step}</button>)}</div>
  </div>;
}

function ProjectGraph() {
  const [active, setActive] = useState("evidence");
  const [entered, setEntered] = useState(false);
  const graphRef = useRef(null);
  useEffect(() => {
    if (!graphRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setEntered(true); observer.disconnect(); }
    }, { threshold: .2 });
    observer.observe(graphRef.current);
    return () => observer.disconnect();
  }, []);
  const selected = graphNodes.find(node => node.id === active);
  const Icon = selected.icon;
  return <div ref={graphRef} className={`${styles.graphBoard} ${entered ? styles.graphEntered : ""}`}><div className={styles.graphColumns}><GraphColumn title="Capture" number="01" nodes={graphNodes.filter(node => node.lane === "capture")} active={active} onSelect={setActive} /><div className={styles.graphArrow} aria-hidden="true"><span /><ArrowRight size={22} /></div><GraphColumn title="Reconcile" number="02" nodes={graphNodes.filter(node => node.lane === "reconcile")} active={active} onSelect={setActive} central /><div className={styles.graphArrow} aria-hidden="true"><span /><ArrowRight size={22} /></div><GraphColumn title="Verify & deliver" number="03" nodes={graphNodes.filter(node => node.lane === "deliver")} active={active} onSelect={setActive} /></div><div className={styles.graphDetail} role="status" aria-live="polite"><div className={styles.graphDetailIcon}><Icon size={20} aria-hidden="true" /></div><div><span>Selected step</span><strong>{selected.label}</strong><p>{selected.detail}</p></div></div></div>;
}

function GraphColumn({ title, number, nodes, active, onSelect, central = false }) {
  return <div className={`${styles.graphColumn} ${central ? styles.graphCentral : ""}`}><div className={styles.graphTitle}><span>{number}</span><h3>{title}</h3></div><div className={styles.graphNodes}>{nodes.map(node => { const Icon = node.icon; return <button type="button" key={node.id} aria-pressed={active === node.id} onClick={() => onSelect(node.id)} className={active === node.id ? styles.graphNodeActive : ""}><Icon size={18} aria-hidden="true" /><span>{node.label}</span><ChevronRight size={15} className={styles.nodeChevron} aria-hidden="true" /></button>; })}</div></div>;
}

function EvidencePreview() {
  const [active, setActive] = useState("area");
  const fields = [{ id: "owner", label: "Recorded owner", value: "Suresh Kumar", score: "96%", page: "Page 2" }, { id: "survey", label: "Survey number", value: "124/3", score: "99%", page: "Page 1" }, { id: "area", label: "Parcel area", value: "2.50 hectares", score: "94%", page: "Page 2" }];
  const selected = fields.find(field => field.id === active);
  return <div className={styles.evidencePreview} aria-label="Illustrative evidence viewer preview"><div className={styles.previewTop}><span><span className={styles.previewDot} /> EVIDENCE VIEWER</span><span>Survey 124/3</span></div><div className={styles.previewBody}><div className={styles.previewFields}><small>EXTRACTED FIELDS</small>{fields.map(field => <button key={field.id} type="button" onClick={() => setActive(field.id)} aria-pressed={active === field.id} className={active === field.id ? styles.previewFieldActive : ""}><span>{field.label}</span><strong>{field.value}</strong><small>{field.score} OCR · {field.page}</small></button>)}</div><div className={styles.previewDocument}><span className={styles.previewPageTag}>JAMABANDI · {selected.page.toUpperCase()}</span><strong>Record of Rights</strong><div className={styles.previewRule} /><p>District: Kota &nbsp;&nbsp; Village: Rampura</p><p className={active === "survey" ? styles.highlightedLine : ""}>Survey number: 124/3</p><p className={active === "owner" ? styles.highlightedLine : ""}>Recorded owner: Suresh Kumar</p><p className={active === "area" ? styles.highlightedLine : ""}>Total parcel area: 2.50 hectares</p><div className={styles.previewFoot}><Fingerprint size={14} /> Source region highlighted · {selected.score} confidence</div></div></div><div className={styles.previewDisclaimer}>Illustrative interface using synthetic record details.</div></div>;
}
