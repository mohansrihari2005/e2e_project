import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { apiClient } from "../../services/api";

export default function MyComplaints() {
  const auth = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setIsLoading(true);
        const email = auth?.session?.email;
        if (email) {
          const data = await apiClient.listComplaints(email);
          setComplaints(data);
        }
      } catch (err) {
        setError(err.message || "Failed to fetch complaints");
        console.error("Fetch complaints error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComplaints();
  }, [auth?.session?.email]);

  const handleDownloadPDF = async (referenceId) => {
    try {
      await apiClient.downloadReport(referenceId);
    } catch (err) {
      console.error("PDF download error:", err);
    }
  };
  return (
    <div className="glass card">
      <div className="panel-title">Complaint History</div>
      {error && <p style={{ color: "var(--priority-critical)" }}>{error}</p>}
      {isLoading && <p style={{ color: "var(--muted)" }}>Loading...</p>}
      {complaints.length === 0 && !isLoading && (
        <p style={{ color: "var(--muted)" }}>No complaints submitted yet.</p>
      )}
      {complaints.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Subject</th>
              <th>Product</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((complaint) => (
              <tr key={complaint.reference_id}>
                <td>{complaint.reference_id}</td>
                <td>{complaint.subject}</td>
                <td>{complaint.predicted_product}</td>
                <td>
                  <span className={`status-pill ${complaint.priority?.toLowerCase()}`}>
                    {complaint.priority}
                  </span>
                </td>
                <td>{complaint.status}</td>
                <td>{new Date(complaint.created_at).toLocaleDateString()}</td>
                <td style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={() => alert(`Reference: ${complaint.reference_id}\n\nSubject: ${complaint.subject}\n\nPriority: ${complaint.priority}\n\nDepartment: ${complaint.department}`)}
                  >
                    View
                  </button>
                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={() => handleDownloadPDF(complaint.reference_id)}
                  >
                    PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
