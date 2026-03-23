import { useState, useEffect } from "react";
import { apiClient } from "../../services/api";
import ChartCard from "../../components/ChartCard.jsx";

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.getAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return <div style={{ padding: "20px", color: "var(--muted)" }}>Loading analytics...</div>;
  }

  const productData = analytics?.by_product || [];
  const priorityData = analytics?.by_priority || [];
  const departmentData = analytics?.by_department || [];

  return (
    <div className="grid two">
      <ChartCard title="Complaints by Product">
        <div className="chart-bar">
          {productData.map((item) => (
            <span key={item.label} style={{ height: `${(item.value / 400) * 100}%` }} title={item.label} />
          ))}
        </div>
        {productData.length === 0 && <p style={{ color: "var(--muted)" }}>No data</p>}
      </ChartCard>
      <ChartCard title="Priority Distribution">
        <div className="pie" />
        <div style={{ marginTop: "12px" }}>
          {priorityData.map((item) => (
            <div key={item.label} style={{ fontSize: "0.85rem", marginBottom: "4px" }}>
              {item.label}: {item.value}%
            </div>
          ))}
        </div>
      </ChartCard>
      <ChartCard title="Department Routing Load">
        <table className="table" style={{ fontSize: "0.85rem" }}>
          <tbody>
            {departmentData.map((dept) => (
              <tr key={dept.label}>
                <td>{dept.label}</td>
                <td>{dept.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {departmentData.length === 0 && <p style={{ color: "var(--muted)" }}>No data</p>}
      </ChartCard>
    </div>
  );
}
