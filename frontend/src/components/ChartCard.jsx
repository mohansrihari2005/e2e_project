export default function ChartCard({ title, children }) {
  return (
    <div className="glass card">
      <div className="panel-title">{title}</div>
      {children}
    </div>
  );
}
