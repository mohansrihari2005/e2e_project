export default function ResultPanel({ result }) {
  if (!result) {
    return (
      <div className="glass card">
        <div className="panel-title">AI Analysis Result</div>
        <p>No complaint submitted yet.</p>
      </div>
    );
  }

  const priorityClass = result.priority?.toLowerCase() || "low";

  return (
    <div className="glass card">
      <div className="panel-title">AI Analysis Result</div>
      <p>
        <strong>Reference ID:</strong> {result.reference_id}
      </p>
      <p>
        <strong>Predicted Product:</strong> {result.predicted_product}
      </p>
      <p>
        <strong>Priority Level:</strong> <span className={`status-pill ${priorityClass}`}>{result.priority}</span>
      </p>
      <p>
        <strong>Routed Department:</strong> {result.department}
      </p>
      <p>
        <strong>Escalation Status:</strong> {result.escalation_status}
      </p>
      <p>
        <strong>AI Response:</strong> {result.ai_response}
      </p>
      <p>
        <strong>Email sent:</strong> {result.email_sent ? "Confirmed" : "Pending"}
      </p>
      <p>
        <strong>SMS sent:</strong> {result.sms_sent ? "Simulated" : "Pending"}
      </p>
    </div>
  );
}
