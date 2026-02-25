import { type TestCase } from "@/lib/ai/types";
import { motion } from "framer-motion";
import { FileDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestCasePreviewProps {
  testCases: TestCase[];
  downloadUrl: string;
}

/**
 * A table preview of the generated test cases.
 * It strictly shows only a small sample (first 5) to save client memory
 * and heavily encourages the user to download the full suite.
 */
export function TestCasePreview({
  testCases,
  downloadUrl,
}: TestCasePreviewProps) {
  // We preview only the first 5 records
  const previewData = testCases.slice(0, 5);

  const handleDownload = () => {
    // Basic trick to trigger a standard download dialog to Excel using data URI
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `Generated_TestCases_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Live Preview</h2>
          <p className="text-sm text-slate-400 mt-1">
            Showing up to 5 cases. Download to view all.
          </p>
        </div>

        <button
          onClick={handleDownload}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg hover:shadow-primary-500/25 shrink-0"
        >
          <FileDown className="w-5 h-5" />
          <span>Download XLSX</span>
        </button>
      </div>

      <div className="glass-panel overflow-hidden border border-slate-700/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-800/80 text-slate-300 uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Mapped Req</th>
                <th className="px-6 py-4">Title</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {previewData.map((tc) => (
                <tr
                  key={tc.testCaseId}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-slate-400">
                    {tc.testCaseId}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium border",
                        tc.type === "Positive"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : tc.type === "Negative"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20",
                      )}
                    >
                      {tc.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-emerald-400 font-mono text-sm">
                    {tc.mappedRequirementId}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-200">
                    <div className="truncate max-w-[300px]" title={tc.title}>
                      {tc.title}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
