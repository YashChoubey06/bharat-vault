"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getSourceScenarios, getSourceEvidence, getValidationByParcel, runEvidenceResolution, resolveSourceConflict } from '@/services/api/validation';
import styles from './SourceResolution.module.css';

const readable = value => String(value || 'Not evaluated').replaceAll('_',' ');

export default function SourceResolution({ parcelId, validation, onChange }) {
  const { user } = useAuth();
  const [scenarios, setScenarios] = useState([]);
  const [mode, setMode] = useState(validation.mode || 'disabled');
  const [scenario, setScenario] = useState(validation.scenario || 'consistent');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [evidence, setEvidence] = useState(null);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const canRun = ['verification_officer','revenue_officer','system_admin'].includes(user?.role);
  const canReview = ['verification_officer','revenue_officer'].includes(user?.role);
  const resolution = validation.externalResolution;
  useEffect(() => { let active = true; getSourceScenarios().then(data => { if(active) setScenarios(data.scenarios); }).catch(() => {}); return () => { active=false; }; }, []);
  useEffect(() => { setEvidence(null); }, [validation.runId]);

  async function execute() {
    setBusy(true); setError('');
    try { onChange(await runEvidenceResolution({parcelId, sourceMode:mode, scenario:mode==='mock' ? scenario : undefined, requiredFacts:scenario==='court_dispute' && mode==='mock' ? ['case_status'] : []})); }
    catch (err) { setError(err.message || 'Unable to run evidence acquisition.'); }
    finally { setBusy(false); }
  }
  async function loadEvidence() {
    setLoadingEvidence(true); setError('');
    try { setEvidence(await getSourceEvidence(parcelId)); }
    catch (err) { setError(err.message || 'Unable to load source evidence.'); }
    finally { setLoadingEvidence(false); }
  }
  async function refresh() { onChange(await getValidationByParcel(parcelId)); }

  return <section className={styles.panel} aria-labelledby="source-resolution-title">
    <header className={styles.header}><div><h2 id="source-resolution-title">Evidence acquisition</h2><p>Source coverage, field checks and the evidence behind this run.</p></div><span className={styles.tag}>{validation.mode==='mock' ? 'Simulated sources' : 'External source resolution'}</span></header>
    {canRun && <div className={styles.controls}>
      <label>Source mode<select value={mode} onChange={e=>setMode(e.target.value)} disabled={busy}><option value="disabled">No external connections</option><option value="mock">Simulated source demonstration</option><option value="live">Configured real providers</option></select></label>
      {mode==='mock' && <label>Demonstration scenario<select value={scenario} onChange={e=>setScenario(e.target.value)} disabled={busy}>{scenarios.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label>}
      <button type="button" disabled={busy} onClick={execute}>{busy ? 'Acquiring and comparing evidence…' : 'Run evidence resolution'}</button>
    </div>}
    <div role="status" className={styles.notice}>{busy ? 'Trying applicable sources, including bounded retries. Documentary fallback is evaluated after source paths are exhausted.' : validation.mode==='mock' ? 'These are synthetic source responses for demonstration. They do not verify a record against a government system.' : 'External source availability and officer approval are tracked separately.'}</div>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {resolution ? <>
      <div className={styles.metrics}><div><span>Evidence coverage</span><strong>{resolution.resolvedEvidenceCount}/{resolution.requiredEvidenceCount}</strong><small>required categories resolved</small></div><div><span>Resolution</span><strong>{readable(resolution.status)}</strong><small>{resolution.sourcesAttempted} sources queried</small></div><div><span>External verification</span><strong>{readable(resolution.externalVerification)}</strong><small>Document mode: {resolution.documentEvidenceMode?.toLowerCase()}</small></div></div>
      {resolution.documentModeActivated && <p className={styles.notice}>External evidence remains insufficient for {resolution.unresolvedFacts.map(readable).join(', ')}. All planned paths were evaluated. Documentary consistency is {readable(validation.documentConsistency).toLowerCase()}; officer review is required.</p>}
      <div className={styles.tableWrap}><table><caption>Source resolution status</caption><thead><tr><th scope="col">Source</th><th scope="col">Outcome</th><th scope="col">Evidence</th><th scope="col">Attempts</th></tr></thead><tbody>{validation.sources?.map(source=><tr key={source.sourceSystem}><th scope="row">{source.sourceType}<small>{source.sourceSystem}</small></th><td><span className={source.usableRecords ? styles.ok : styles.warning}>{readable(source.status)}</span><small>{source.reason}</small></td><td>{source.usableRecords} usable / {source.recordsFound} found</td><td>{source.attempts}</td></tr>)}</tbody></table></div>
      <details className={styles.details}><summary>Field-level evidence and explanations</summary>{validation.checks?.map((check,index)=><div className={styles.field} key={check.id || index}><strong>{check.name || check.check}: {readable(check.status)}</strong><p>{check.explanation || check.message}</p><ul>{check.sources?.map((source,i)=><li key={source.id || i}>{source.source}: <b>{typeof source.value==='object' ? JSON.stringify(source.value) : source.value}</b>{source.page ? `, page ${source.page}` : ''}{source.sourceRecordId ? ` (${source.sourceRecordId})` : ''}</li>)}</ul></div>)}</details>
      {canReview && validation.conflicts?.filter(c=>c.status==='OPEN').map(conflict=><ConflictReview key={validation.runId+conflict.id} conflict={conflict} parcelId={parcelId} runId={validation.runId} onSaved={refresh} />)}
      <div className={styles.provenance}><span>Run {validation.runId}<small>{new Date(validation.updatedAt).toLocaleString()}</small></span><button type="button" onClick={loadEvidence} disabled={loadingEvidence}>{loadingEvidence ? 'Loading provenance…' : 'Inspect raw source evidence'}</button></div>
      {evidence && <div>{evidence.records.length ? evidence.records.map(record=><details className={styles.details} key={record.id}><summary>{record.sourceSystem} / {record.externalRecordId || 'Invalid record'} / {record.status}</summary><p>Retrieved {new Date(record.retrievedAt).toLocaleString()}. Reliability {Math.round(record.reliability*100)}%. {record.simulated ? 'Simulated source.' : ''}</p><code className={styles.hash}>SHA-256: {record.dataHash}</code><pre>{JSON.stringify(record.rawData,null,2)}</pre></details>) : <p className={styles.notice}>No external source records were retrieved in this run. Query outcomes are retained in the audit history.</p>}</div>}
    </> : <p className={styles.notice}>Run evidence acquisition to evaluate source coverage for this parcel.</p>}
  </section>;
}

function ConflictReview({ conflict, parcelId, runId, onSaved }) {
  const [selected, setSelected] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { await resolveSourceConflict(parcelId,conflict.id,{runId,selectedEvidenceId:selected,notes}); await onSaved(); }
    catch(err) { setError(err.message || 'Unable to record resolution.'); }
    finally { setBusy(false); }
  }
  return <details className={styles.details}><summary>Officer resolution: {readable(conflict.type)}</summary><form onSubmit={submit} className={styles.review}><p>{conflict.description}</p><label>Evidence accepted for this decision<select required value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Select supporting evidence</option>{conflict.sources.filter(s=>s.id && s.normalizedValue!=null).map(s=><option value={s.id} key={s.id}>{s.source}: {String(s.value)}</option>)}</select></label><label>Reason and evidence reviewed<textarea required minLength={5} value={notes} onChange={e=>setNotes(e.target.value)} /></label><p>Original source values remain in the record. This decision records officer judgment and does not alter external verification.</p><button disabled={busy} type="submit">{busy ? 'Saving decision…' : 'Record conflict resolution'}</button>{error && <p role="alert" className={styles.error}>{error}</p>}</form></details>;
}
