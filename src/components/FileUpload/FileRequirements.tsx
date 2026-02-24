import { CheckCircle2 } from "lucide-react";

/**
 * A stateless presentation component that outlines
 * the exact rules for file uploads. Separating this from DragDropZone Keep both files small and focused.
 */
export function FileRequirements() {
  const requirements = [
    "Maximum file size is 10MB",
    "Supported formats: .pdf, .docx, .txt",
    "Must contain a valid Usage Decision or Application Logic document",
  ];

  return (
    <div className="mt-8 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 max-w-2xl mx-auto backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
        Upload Requirements
      </h3>
      <ul className="space-y-3">
        {requirements.map((req, idx) => (
          <li
            key={idx}
            className="flex items-start space-x-3 text-sm text-slate-400"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <span>{req}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
