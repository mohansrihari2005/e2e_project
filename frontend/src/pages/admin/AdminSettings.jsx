export default function AdminSettings() {
  return (
    <div className="glass card">
      <div className="panel-title">Admin Settings</div>
      <label>Routing ruleset</label>
      <select defaultValue="enterprise">
        <option value="enterprise">Enterprise SLA</option>
        <option value="regulated">Regulatory compliance</option>
        <option value="agile">Agile triage</option>
      </select>
      <label>Auto escalation</label>
      <select defaultValue="enabled">
        <option value="enabled">Enabled for Critical</option>
        <option value="disabled">Disabled</option>
      </select>
      <button className="primary-btn" type="button" style={{ marginTop: "16px" }}>
        Save Settings
      </button>
    </div>
  );
}
