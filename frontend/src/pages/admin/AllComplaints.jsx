import { useState, useEffect } from "react";
import { apiClient } from "../../services/api";

export default function AllComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.listComplaints();
        setComplaints(data);
        setFilteredComplaints(data);
      } catch (error) {
        console.error("Failed to fetch complaints:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const handleFilter = () => {
    let filtered = complaints;

    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.reference_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (priorityFilter) {
      filtered = filtered.filter(c => c.priority === priorityFilter);
    }

    setFilteredComplaints(filtered);
  };

  useEffect(() => {
    handleFilter();
  }, [searchTerm, priorityFilter]);
  return (
    <div className="glass card">
      <div className="panel-title">All Complaints</div>
      <div style={{ display: "flex", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
        <input 
          placeholder="Search by reference or email" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select 
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All priorities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <button className="secondary-btn" onClick={handleFilter}>Filter</button>
      </div>
      
      {isLoading && <p style={{ color: "var(--muted)" }}>Loading complaints...</p>}
      {!isLoading && filteredComplaints.length === 0 && (
        <p style={{ color: "var(--muted)" }}>No complaints match your filters.</p>
      )}
      
      {!isLoading && filteredComplaints.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Subject</th>
              <th>Email</th>
              <th>Product</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredComplaints.map((complaint) => (
              <tr key={complaint.reference_id}>
                <td>{complaint.reference_id}</td>
                <td>{complaint.subject}</td>
                <td>{complaint.email}</td>
                <td>{complaint.predicted_product}</td>
                <td>
                  <span className={`status-pill ${complaint.priority?.toLowerCase()}`}>
                    {complaint.priority}
                  </span>
                </td>
                <td>{complaint.status}</td>
                <td>
                  <button 
                    className="secondary-btn" 
                    type="button"
                    onClick={() => alert(`AI Response:\n\n${complaint.ai_response}`)}
                  >
                    View response
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
