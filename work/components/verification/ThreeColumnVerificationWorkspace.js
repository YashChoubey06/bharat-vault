"use client";
import { useEffect, useState } from "react";
import { getEvidenceViewerWorkspace, reviewEvidence } from "@/services/api/validation";
import VerificationDecisionModal from "./VerificationDecisionModal";
import styles from "./ThreeColumnVerificationWorkspace.module.css";
export default function ThreeColumnVerificationWorkspace({ parcelData }) {
  const [fields, setFields] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    setFields([]);
    getEvidenceViewerWorkspace(parcelData.id).then(data => setFields(data.fields)).catch(err => setError(err.message));
  }, [parcelData.id]);
  async function save(payload) {
    await reviewEvidence(selected.id, {version:selected.version, value:payload.value, notes:payload.reason, state:"verified"});
    const workspace = await getEvidenceViewerWorkspace(parcelData.id);
    setFields(workspace.fields);
  }
  return <div className={styles.container}>
    <div className={styles.header}><h2 className={styles.title}>Verification Workspace</h2></div>
    {error && <p role="alert">{error}</p>}
    <div className={styles.tableWrapper}><table className={styles.workspaceTable}>
      <thead><tr><th>Field</th><th>Record Value</th><th>Evidence Source</th><th>Status</th><th>Officer Decision</th></tr></thead>
      <tbody>{fields.map(field => <tr key={field.id}>
        <td>{field.label || field.field}</td><td>{field.value}</td><td>{field.source} · Page {field.page}</td>
        <td>{field.reviewStatus}</td><td><button className={styles.btnViewDecision} onClick={() => setSelected(field)}>Review field</button></td>
      </tr>)}</tbody>
    </table>{!fields.length && <p>No extracted fields are available. Upload and process a source document first.</p>}</div>
    {selected && <VerificationDecisionModal key={`${selected.id}-${selected.version}`} isOpen onClose={() => setSelected(null)}
      parcelId={parcelData.id} fieldName={selected.label || selected.field} aiExtracted={selected.originalValue || selected.value}
      rorValue={selected.value} gisValue="" onSaveDecision={save} />}
  </div>;
}
