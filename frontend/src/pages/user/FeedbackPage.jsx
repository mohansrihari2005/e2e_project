import { useState } from "react";
import { apiClient } from "../../services/api";

export default function FeedbackPage() {
  const [referenceId, setReferenceId] = useState("");
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!referenceId) {
      setError("Please enter a reference ID.");
      return;
    }
    setStatus("Submitting...");
    setError("");
    try {
      await apiClient.submitFeedback(referenceId, parseInt(rating), comment);
      setStatus("Feedback submitted successfully.");
      // Reset form
      setReferenceId("");
      setRating("5");
      setComment("");
    } catch (err) {
      setError(err.message || "Submission failed.");
      setStatus("");
    }
  };

  return (
    <div className="glass card">
      <div className="panel-title">Resolution Feedback</div>
      <p>Help us improve by rating the resolution quality.</p>
      <label>Complaint Reference ID</label>
      <input
        value={referenceId}
        onChange={(event) => setReferenceId(event.target.value)}
        placeholder="CMP-XXXXXX"
      />
      <label>Rating</label>
      <select value={rating} onChange={(event) => setRating(event.target.value)}>
        <option value="5">5 - Excellent</option>
        <option value="4">4 - Good</option>
        <option value="3">3 - Average</option>
        <option value="2">2 - Needs improvement</option>
        <option value="1">1 - Poor</option>
      </select>
      <label>Comments</label>
      <textarea
        rows="4"
        placeholder="Share your experience"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />
      <button className="primary-btn" type="button" onClick={handleSubmit}>
        Submit Feedback
      </button>
      {error && <p style={{ color: "var(--priority-critical)" }}>{error}</p>}
      {status && <p style={{ color: "var(--priority-low)" }}>{status}</p>}
    </div>
  );
}
