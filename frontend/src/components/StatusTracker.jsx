export default function StatusTracker({ steps }) {
  return (
    <div className="glass card">
      <div className="panel-title">Complaint Status Tracker</div>
      <div className="status-steps">
        {steps.map((step) => (
          <div key={step} className="status-step">
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}
