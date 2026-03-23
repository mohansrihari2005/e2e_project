export default function Reports() {
  return (
    <div className="glass card">
      <div className="panel-title">Reports & Export</div>
      <p>Generate compliance-ready analytics exports and operational summaries.</p>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button className="primary-btn" type="button">Export to Excel</button>
        <button className="secondary-btn" type="button">Download Analytics PDF</button>
      </div>
    </div>
  );
}
