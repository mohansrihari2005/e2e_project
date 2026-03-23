import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { apiClient } from "../../services/api";
import ComplaintForm from "../../components/ComplaintForm.jsx";
import ResultPanel from "../../components/ResultPanel.jsx";
import StatCard from "../../components/StatCard.jsx";
import DataTable from "../../components/DataTable.jsx";

export default function UserDashboard() {
  const auth = useAuth();
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const email = auth?.session?.email;
        
        // Fetch user stats
        const statsData = await apiClient.getUserStats(email);
        setStats(statsData);

        // Fetch user complaints
        const complaintsList = await apiClient.listComplaints(email);
        setComplaints(complaintsList);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (auth?.session?.email) {
      fetchData();
    }
  }, [auth?.session?.email]);

  if (isLoading) {
    return <div style={{ padding: "20px", color: "var(--muted)" }}>Loading...</div>;
  }

  return (
    <>
      <div className="banner">
        <div className="section-title">Welcome back, {auth?.session?.name || "Customer"}</div>
        <p>Track your complaint lifecycle, AI response, and escalation status in one place.</p>
      </div>

      <div className="grid stats">
        <StatCard 
          label="Total Complaints" 
          value={stats?.total || 0} 
          trend={`${stats?.total > 0 ? stats.total + ' submitted' : 'No complaints yet'}`} 
        />
        <StatCard 
          label="Open Cases" 
          value={stats?.open || 0} 
          trend={stats?.open ? `${stats.open} pending` : "All resolved"} 
        />
        <StatCard 
          label="Resolved" 
          value={stats?.resolved || 0} 
          trend={stats?.resolved ? `${Math.round((stats.resolved / (stats.total || 1)) * 100)}% done` : "0%"} 
        />
        <StatCard 
          label="Critical" 
          value={stats?.critical || 0} 
          trend={stats?.critical ? "Action needed" : "No critical issues"} 
          tone={stats?.critical > 0 ? "var(--priority-critical)" : "var(--priority-low)"} 
        />
      </div>

      <div className="grid two">
        <ComplaintForm email={auth?.session?.email} onResult={setResult} />
        <ResultPanel result={result} />
      </div>

      {complaints.length > 0 && (
        <>
          <div className="section-title">Your Recent Complaints</div>
          <DataTable
            columns={["Reference", "Subject", "Product", "Priority", "Status", "Created"]}
            rows={complaints.map(c => ({
              referenceId: c.reference_id,
              reference: c.reference_id,
              subject: c.subject,
              product: c.predicted_product,
              priority: c.priority,
              status: c.status,
              created: new Date(c.created_at).toLocaleDateString()
            }))}
          />
        </>
      )}
    </>
  );
}
