export default function StatCard({ label, value, trend, tone }) {
  return (
    <div className="glass card">
      <div style={{ color: "var(--muted)", fontSize: "0.82rem" }}>{label}</div>
      <div style={{ fontSize: "1.6rem", fontWeight: 700, margin: "10px 0" }}>
        {value}
      </div>
      <div style={{ color: tone || "var(--primary)", fontWeight: 600 }}>{trend}</div>
    </div>
  );
}
