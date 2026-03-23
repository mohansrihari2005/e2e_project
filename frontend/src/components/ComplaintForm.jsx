import { useState, useEffect } from "react";
import { apiClient } from "../services/api";

export default function ComplaintForm({ onResult, email }) {
  const [form, setForm] = useState({
    subject: "",
    email: email || "",
    phone: "",
    language: "",
    complaint_text: "",
    attachment_name: ""
  });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (email) {
      setForm(prev => ({ ...prev, email }));
    }
  }, [email]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const data = await apiClient.createComplaint(form);
      onResult?.(data);
      setStatus("success");
      // Reset form after successful submission
      setTimeout(() => {
        setForm({
          subject: "",
          email: "",
          phone: "",
          language: "",
          complaint_text: "",
          attachment_name: ""
        });
        setStatus("idle");
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to submit complaint");
      setStatus("error");
      console.error("Complaint submission error:", err);
    }
  };

  return (
    <form className="glass card" onSubmit={handleSubmit}>
      <div className="panel-title">Submit a Complaint</div>
      <div className="form-grid">
        <div className="form-group">
          <label>Subject / Title</label>
          <input
            type="text"
            value={form.subject}
            onChange={(event) => update("subject", event.target.value)}
            placeholder="e.g. Refund delayed beyond SLA"
            required
          />
        </div>
        <div className="form-group">
          <label>Email address</label>
          <input
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="form-group">
          <label>Phone number (optional)</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
            placeholder="+91 90000 00000"
          />
        </div>
        <div className="form-group">
          <label>Language (optional)</label>
          <select value={form.language} onChange={(event) => update("language", event.target.value)}>
            <option value="">Auto-detect</option>
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Tamil">Tamil</option>
            <option value="Telugu">Telugu</option>
          </select>
        </div>
        <div className="form-group span-full">
          <label>Complaint text</label>
          <textarea
            rows="5"
            value={form.complaint_text}
            onChange={(event) => update("complaint_text", event.target.value)}
            placeholder="Describe the issue in detail"
            required
          />
        </div>
        <div className="form-group span-full">
          <label>Attachment upload</label>
          <input
            type="file"
            onChange={(event) => update("attachment_name", event.target.files?.[0]?.name || "")}
          />
        </div>
      </div>
      <button className="primary-btn" type="submit">
        {status === "loading" ? "Analyzing..." : "Analyze & Submit Complaint"}
      </button>
      {status === "error" && (
        <p style={{ color: "var(--priority-critical)" }}>
          {error || "Submission failed. Please try again."}
        </p>
      )}
      {status === "success" && (
        <p style={{ color: "var(--priority-low)" }}>
          Complaint submitted successfully! Check your email for confirmation.
        </p>
      )}
    </form>
  );
}
