import { useState } from "react";
import ComplaintForm from "../../components/ComplaintForm.jsx";
import ResultPanel from "../../components/ResultPanel.jsx";

export default function SubmitComplaint() {
  const [result, setResult] = useState(null);

  return (
    <div className="grid two">
      <ComplaintForm onResult={setResult} />
      <ResultPanel result={result} />
    </div>
  );
}
