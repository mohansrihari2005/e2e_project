export const complaintStats = {
  total: 1284,
  open: 212,
  resolved: 972,
  critical: 38
};

export const complaintHistory = [
  {
    referenceId: "CMP-7F92B1C09D",
    subject: "Duplicate charge on invoice",
    product: "Payments",
    priority: "High",
    status: "In Review",
    createdAt: "2026-02-06"
  },
  {
    referenceId: "CMP-58AF3E17D1",
    subject: "App crash after update",
    product: "Mobile App",
    priority: "Medium",
    status: "Assigned",
    createdAt: "2026-02-05"
  },
  {
    referenceId: "CMP-1A12D93E44",
    subject: "Refund delayed beyond 14 days",
    product: "Billing",
    priority: "High",
    status: "Escalated",
    createdAt: "2026-02-04"
  }
];

export const adminMetrics = {
  total: 2981,
  critical: 61,
  today: 84,
  resolved: 2390
};

export const productChart = [
  { label: "Billing", value: 320 },
  { label: "Payments", value: 410 },
  { label: "Logistics", value: 265 },
  { label: "Mobile App", value: 190 },
  { label: "Authentication", value: 155 }
];

export const priorityChart = [
  { label: "Critical", value: 8, color: "var(--priority-critical)" },
  { label: "High", value: 22, color: "var(--priority-high)" },
  { label: "Medium", value: 40, color: "var(--priority-medium)" },
  { label: "Low", value: 30, color: "var(--priority-low)" }
];

export const departmentLoad = [
  { label: "Finance", value: 42 },
  { label: "Operations", value: 24 },
  { label: "Security", value: 18 },
  { label: "Digital Experience", value: 10 },
  { label: "Customer Care", value: 28 }
];

export const monthlyTrends = [
  { month: "Sep", value: 180 },
  { month: "Oct", value: 240 },
  { month: "Nov", value: 210 },
  { month: "Dec", value: 260 },
  { month: "Jan", value: 300 },
  { month: "Feb", value: 280 }
];
