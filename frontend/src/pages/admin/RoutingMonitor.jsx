import { useState, useEffect } from "react";
import { apiClient } from "../../services/api";

export default function RoutingMonitor() {
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const analytics = await apiClient.getAnalytics();
        setDepartments(analytics?.by_department || []);
      } catch (error) {
        console.error("Failed to fetch routing data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div style={{ padding: "20px", color: "var(--muted)" }}>Loading routing monitor...</div>;
  }
  return (
    <div className="glass card">
      <div className="panel-title">Routing Monitor</div>
      <table className="table">
        <thead>
          <tr>
            <th>Department</th>
            <th>Assigned Complaints</th>
            <th>Routing Status</th>
          </tr>
        </thead>
        <tbody>
          {departments.map((dept) => (
            <tr key={dept.label}>
              <td>{dept.label}</td>
              <td>{dept.value}</td>
              <td>
                <span style={{ fontSize: "0.85rem", color: "var(--primary)" }}>
                  {dept.value < 20 ? "✓ Balanced" : dept.value > 40 ? "⚠ Overloaded" : "→ Normal"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
