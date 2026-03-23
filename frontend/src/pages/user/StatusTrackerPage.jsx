import StatusTracker from "../../components/StatusTracker.jsx";

export default function StatusTrackerPage() {
  const steps = [
    "Complaint received",
    "AI classification complete",
    "Assigned to department",
    "Specialist reviewing",
    "Resolution in progress",
    "Closed"
  ];

  return <StatusTracker steps={steps} />;
}
