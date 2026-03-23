export default function DataTable({ columns, rows }) {
  return (
    <div className="glass card">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id || row.referenceId}>
              {Object.values(row).map((cell, index) => (
                <td key={`${row.referenceId}-${index}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
