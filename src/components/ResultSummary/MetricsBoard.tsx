import { type CoverageBreakdown } from "@/lib/ai/types";
import {
  ClipboardCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  LayoutTemplate,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MetricsBoardProps {
  summary: CoverageBreakdown;
}

/**
 * Displays an aggregated view of the deterministic coverage metrics.
 * Uses staggered framer-motion animations to deliver a premium reveal feel.
 */
export function MetricsBoard({ summary }: MetricsBoardProps) {
  const metricsList = [
    {
      label: "Total Req.",
      value: summary.totalRequirements,
      icon: ClipboardCheck,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Strong Coverage",
      value: summary.strongCovered,
      icon: CheckCircle,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      label: "Moderate Coverage",
      value: summary.moderateCovered,
      icon: ShieldCheck,
      color: "text-teal-400",
      bg: "bg-teal-400/10",
    },
    {
      label: "Partial Coverage",
      value: summary.partiallyCovered,
      icon: AlertTriangle,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
    },
    {
      label: "Not Covered",
      value: summary.notCovered,
      icon: XCircle,
      color: "text-red-400",
      bg: "bg-red-400/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
      {metricsList.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className="glass-panel p-5 flex items-center space-x-4 hover:bg-slate-800/60 transition-colors"
          >
            <div className={cn("p-3 rounded-xl", metric.bg, metric.color)}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-bold font-mono text-slate-100">
                {metric.value}
              </p>
              <p className="text-sm font-medium text-slate-400">
                {metric.label}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
