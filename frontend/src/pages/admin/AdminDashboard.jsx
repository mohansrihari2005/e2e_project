import { useState, useEffect } from "react";
import { apiClient } from "../../services/api";
import StatCard from "../../components/StatCard.jsx";
import ChartCard from "../../components/ChartCard.jsx";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const statsData = await apiClient.getAdminStats();
        const analyticsData = await apiClient.getAnalytics();
        setStats(statsData);
        setAnalytics(analyticsData);
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div style={{ padding: "20px", color: "var(--muted)" }}>Loading dashboard...</div>;
  }

  const getProductChart = () => analytics?.by_product || [];
  const getPriorityChart = () => analytics?.by_priority || [];
  const getMonthlyTrends = () => analytics?.by_month || [];
  return (
    <>
      <div className="grid stats">
        <StatCard label="Total Complaints" value={stats?.total || 0} trend="Enterprise scale" />
        <StatCard label="Critical" value={stats?.critical || 0} trend="Escalation queue" tone="var(--priority-critical)" />
        <StatCard label="Today" value={stats?.today || 0} trend="Live intake" />
        <StatCard label="Resolved" value={stats?.resolved || 0} trend={`${stats?.resolved ? 'SLA 97%' : '0'}`} />
      </div>

      <div className="grid two">
        <ChartCard title="Complaints by Product">
          <div className="chart-bar">
            {getProductChart().map((item) => (
              <span key={item.label} style={{ height: `${(item.value / 400) * 100}%` }} title={item.label} />
            ))}
          </div>
          <div style={{ display: "flex", gap: "12px", marginTop: "12px", flexWrap: "wrap" }}>
            {getProductChart().map((item) => (
              <div key={item.label} style={{ fontSize: "0.8rem" }}>
                {item.label}: {item.value}
              </div>
            ))}
          </div>
        </ChartCard>
        <ChartCard title="Priority Distribution">
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <div className="pie" />
            <div>
              {getPriorityChart().map((item) => (
                <div key={item.label} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: item.label === "Critical" ? "var(--priority-critical)" : item.label === "High" ? "var(--priority-high)" : item.label === "Medium" ? "var(--priority-medium)" : "var(--priority-low)" }} />
                  <span>{item.label}: {item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Monthly Complaint Trends">
        <div className="chart-bar">
          {getMonthlyTrends().map((item) => (
            <span key={item.month} style={{ height: `${(item.value / 300) * 100}%` }} title={`${item.month}: ${item.value}`} />
          ))}
        </div>
        <div style={{ display: "flex", gap: "12px", marginTop: "12px", flexWrap: "wrap", fontSize: "0.8rem" }}>
          {getMonthlyTrends().map((item) => (
            <div key={item.month}>
              {item.month}: {item.value}
            </div>
          ))}
        </div>
      </ChartCard>
    </>
  );
}
