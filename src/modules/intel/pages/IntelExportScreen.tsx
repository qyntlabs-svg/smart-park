// Screen: MI-08 · Primitives: (none directly — cross-cutting)
// Route: /intel/export
// CSV downloads (mock, blob URLs) + "Copy sample API request" section.

import { useState } from "react";
import { Copy, Download, Check, FileText } from "lucide-react";
import {
  IntelCard,
  IntelError,
  IntelLayout,
  IntelLoading,
} from "../components/IntelLayout";
import { useIntelExport } from "../hooks";

type ExportKind = "days" | "hours" | "bench";

const EXPORT_META: Record<
  ExportKind,
  { title: string; description: string; filename: string }
> = {
  days: {
    title: "Daily zone metrics",
    description: "date × zone × sessions × GMV × unmet × avg price × users",
    filename: "intel_daily_zones.csv",
  },
  hours: {
    title: "Hourly demand cells",
    description: "date × hour × zone × demand × supply-busy (first 5k rows)",
    filename: "intel_hourly_demand.csv",
  },
  bench: {
    title: "Provider benchmarks",
    description: "Providers × uptime × utilization × rating × GMV",
    filename: "intel_provider_benchmarks.csv",
  },
};

const SAMPLE_REQUEST = `curl -X GET "https://api.smartpark.example/v1/intel/overview?city=chennai&range=30d" \\
  -H "Authorization: Bearer $SMARTPARK_INTEL_TOKEN" \\
  -H "Accept: application/json"`;

const ExportRow = ({ kind }: { kind: ExportKind }) => {
  const { data, isLoading, isError } = useIntelExport(kind);
  const meta = EXPORT_META[kind];

  const handleDownload = () => {
    if (!data) return;
    const blob = new Blob([data], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = meta.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const rowCount = data ? data.split("\n").length - 1 : 0;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-11 rounded bg-slate-900 border border-slate-700 flex items-center justify-center">
          <FileText className="w-4 h-4 text-slate-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold">{meta.title}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {meta.description}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-[11px] text-slate-500 font-mono">
          {isLoading ? "generating…" : `${rowCount.toLocaleString()} rows`}
        </div>
        <button
          onClick={handleDownload}
          disabled={!data || isError}
          className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-[11px] hover:bg-slate-700 disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          Download CSV
        </button>
      </div>
      {isError ? <IntelError msg="Failed to prepare CSV." /> : null}
    </div>
  );
};

const IntelExportScreen = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SAMPLE_REQUEST);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <IntelLayout
      title="Data export & API"
      subtitle="Download the synthesized dataset · sample API integration"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <ExportRow kind="days" />
        <ExportRow kind="hours" />
        <ExportRow kind="bench" />
      </div>

      <IntelCard
        title="Sample API request"
        action={
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-[11px] hover:bg-slate-700"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        }
      >
        <pre className="bg-slate-950 border border-slate-800 rounded p-3 text-[12px] text-slate-200 overflow-x-auto font-mono whitespace-pre">
{SAMPLE_REQUEST}
        </pre>
        <p className="text-[11px] text-slate-400 mt-3">
          Full API reference lives in the Developer Portal (
          <span className="font-mono text-slate-300">/dev</span>). Access tokens
          are scoped per-city and rate-limited.
        </p>
      </IntelCard>

      {(!EXPORT_META || Object.keys(EXPORT_META).length === 0) && (
        <IntelLoading />
      )}
    </IntelLayout>
  );
};

export default IntelExportScreen;
