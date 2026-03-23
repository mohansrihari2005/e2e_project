export default function UserSettings() {
  return (
    <div className="glass card">
      <div className="panel-title">Settings</div>
      <label>Notification Preferences</label>
      <div style={{ display: "grid", gap: "10px" }}>
        <label>
          <input type="checkbox" defaultChecked /> Email updates
        </label>
        <label>
          <input type="checkbox" defaultChecked /> SMS updates (simulated)
        </label>
        <label>
          <input type="checkbox" /> Auto-translate non-English complaints
        </label>
      </div>
      <button className="primary-btn" type="button" style={{ marginTop: "16px" }}>
        Save Settings
      </button>
    </div>
  );
}
