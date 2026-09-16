"use client";

import { useState, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import {
  Activity,
  AlertTriangle,
  Aperture,
  CheckCircle2,
  FileBarChart2,
  FolderKanban,
  LayoutDashboard,
  Loader2,
  Settings,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";
import agentData from "@/data/agent-outputs.json";

const { planning, risk, financial, engineering } = agentData;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${MONTHS[m - 1]}, ${y}`;
}

const SHORT_NAMES: Record<string, string> = {
  "Phoenix ERP Migration": "Phoenix ERP",
  "Claims Portal Modernization": "Claims Portal",
  "Data Platform Uplift": "Data Platform",
};
const shortName = (n: string) => SHORT_NAMES[n] ?? n;

const DARK = "#1e3a5f";
const ACCENT = "#2563eb";
const SLATE = "#94a3b8";
const RED = "#ef4444";
const AMBER = "#f59e0b";
const GREEN = "#10b981";

type Tone = "positive" | "warning" | "negative" | "neutral";
const BADGE_TONE: Record<string, Tone> = {
  RED: "negative",
  HIGH: "negative",
  OVER: "negative",
  AMBER: "warning",
  MEDIUM: "warning",
  GREEN: "positive",
  ON_TRACK: "positive",
  LOW: "neutral",
};
const BADGE_CLASS: Record<Tone, string> = {
  positive: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  negative: "bg-red-50 text-red-700 ring-1 ring-red-200",
  neutral: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};
function Badge({ value }: { value: string }) {
  const tone = BADGE_TONE[value] ?? "neutral";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${BADGE_CLASS[tone]}`}
    >
      {value.replace("_", " ")}
    </span>
  );
}

type Tile = { value: string; label: string; tone: "dark" | "accent" | "light" };
const TILE_CLASS: Record<Tile["tone"], string> = {
  dark: "bg-[#1e3a5f] text-white",
  accent: "bg-blue-600 text-white",
  light: "bg-blue-50 text-slate-900",
};
function KpiStrip({ tiles }: { tiles: Tile[] }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${tiles.length}, 1fr)` }}>
      {tiles.map((t, i) => (
        <div
          key={t.label}
          className={`${TILE_CLASS[t.tone]} px-4 py-3 text-center ${
            i === 0 ? "rounded-tl-xl" : ""
          } ${i === tiles.length - 1 ? "rounded-tr-xl" : ""}`}
        >
          <p className="font-display text-lg font-bold tabular-nums leading-tight">
            {t.value}
          </p>
          <p className="text-[11px] mt-0.5 opacity-90">{t.label}</p>
        </div>
      ))}
    </div>
  );
}

function DashCard({
  tiles,
  title,
  subtitle,
  children,
}: {
  tiles: Tile[];
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <KpiStrip tiles={tiles} />
      <div className="p-3.5">
        <p className="font-display text-[13px] font-semibold text-slate-800">{title}</p>
        {subtitle && <p className="text-[11px] text-slate-400 mb-0.5">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

function HBarChart({
  data,
  valueSuffix = "",
}: {
  data: { name: string; value: number; color: string }[];
  valueSuffix?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={98}>
      <BarChart data={data} layout="vertical" margin={{ top: 2, right: 26, left: 0, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={80}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10.5, fill: "#64748b" }}
        />
        <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={10}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            formatter={(v) => `${v}${valueSuffix}`}
            style={{ fontSize: 10.5, fill: "#0f172a", fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

const BRIEF_SECTION_ICONS: Record<string, LucideIcon> = {
  "portfolio pulse": Activity,
  "top 3 risks": AlertTriangle,
  "financial snapshot": Wallet,
  "projects at a glance": FolderKanban,
  "recommended actions": CheckCircle2,
};

function parseBriefSections(markdown: string) {
  const chunks = markdown.split(/(?=^## )/m).filter((c) => c.trim());
  return chunks.map((chunk) => {
    const match = chunk.match(/^##\s+(.+?)\s*\n([\s\S]*)$/);
    if (!match) return { title: "", body: chunk.trim() };
    return { title: match[1].trim(), body: match[2].trim() };
  });
}

const briefBodyComponents: Components = {
  p: ({ children }) => (
    <p className="text-[13px] text-slate-600 leading-relaxed mb-2 last:mb-0">{children}</p>
  ),
  ul: ({ children }) => <ul className="list-none pl-0 space-y-1.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-none pl-0 space-y-1.5">{children}</ol>,
  li: ({ children }) => (
    <li className="flex gap-2.5 text-[13px] text-slate-600 leading-relaxed">
      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-violet-500" />
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => <strong className="text-slate-900 font-semibold">{children}</strong>,
};

function Sidebar() {
  const items = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: FileBarChart2, label: "Reports", active: false },
    { icon: FolderKanban, label: "Projects", active: false },
    { icon: Settings, label: "Settings", active: false },
  ];
  return (
    <aside className="hidden md:flex w-36 shrink-0 flex-col bg-[#1e3a5f] py-4">
      <nav className="flex flex-col gap-1 px-3">
        {items.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            type="button"
            className={`flex flex-col items-center gap-1.5 rounded-lg px-2 py-3 text-[11px] font-medium transition-colors ${
              active
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </nav>
      <div className="mt-auto flex justify-center pt-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-slate-300">
          <Aperture className="h-5 w-5" strokeWidth={1.75} />
        </div>
      </div>
    </aside>
  );
}

export default function Home() {
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  async function generateBrief() {
    setLoading(true);
    setBrief("");
    setGenerated(false);

    const res = await fetch("/api/brief", { method: "POST" });
    if (!res.body) return;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      setBrief(text);
    }

    setLoading(false);
    setGenerated(true);
  }

  const capexData = financial.projects.map((p) => ({
    name: shortName(p.name),
    Approved: +(p.approved / 1_000_000).toFixed(2),
    Actual: +(p.actual / 1_000_000).toFixed(2),
    Forecast: +(p.forecast / 1_000_000).toFixed(2),
  }));

  const snapshotRows = planning.projects.map((p) => {
    const eng = engineering.projects.find((e) => e.name === p.name);
    const fin = financial.projects.find((f) => f.name === p.name);
    return {
      name: p.name,
      slip: p.slippageDays,
      sprint: eng?.sprintHealth ?? "—",
      capex: fin?.status ?? "—",
    };
  });

  const slippageData = planning.projects.map((p) => ({
    name: shortName(p.name),
    value: p.slippageDays,
    color: p.slippageDays > 10 ? RED : p.slippageDays > 0 ? AMBER : GREEN,
  }));
  const maxSlip = Math.max(...planning.projects.map((p) => p.slippageDays));

  const riskData = risk.flags.map((f) => ({
    name: shortName(f.project),
    value: Math.round(f.confidence * 100),
    color: f.severity === "HIGH" ? RED : f.severity === "MEDIUM" ? AMBER : SLATE,
  }));
  const highSeverityCount = risk.flags.filter((f) => f.severity === "HIGH").length;

  const overrunData = financial.projects.map((p) => {
    const overrun = Math.round(((p.forecast - p.approved) / p.approved) * 1000) / 10;
    return {
      name: shortName(p.name),
      value: overrun,
      color: overrun > 10 ? RED : overrun > 0 ? AMBER : GREEN,
    };
  });

  const velocityData = engineering.projects.map((p) => ({
    name: shortName(p.name),
    value: Math.round((p.velocity / p.velocityTarget) * 100),
    color: p.sprintHealth === "RED" ? RED : p.sprintHealth === "AMBER" ? AMBER : GREEN,
  }));
  const totalDefects = engineering.projects.reduce((s, p) => s + p.openDefects, 0);
  const criticalDefects = engineering.projects.reduce((s, p) => s + p.criticalDefects, 0);

  const briefSections = parseBriefSections(brief);

  return (
    <div className="flex min-h-screen bg-[#f4f6fb] font-sans">
      <Sidebar />

      <main className="flex-1 min-w-0 px-5 py-6 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
                Executive Dashboard
              </h1>
              <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-wide">
                Data as of {formatDate(planning.asOf)} · All Active Projects
              </p>
            </div>
            <button
              onClick={generateBrief}
              disabled={loading}
              className="flex shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-violet-500/35 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                  Generating
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" strokeWidth={2.5} />
                  {generated ? "Regenerate Brief" : "Generate Executive Brief"}
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <KpiStrip
                tiles={[
                  { value: `+${financial.variancePct}%`, label: "YTD Variance", tone: "light" },
                  { value: `$${(financial.ytdSpend / 1_000_000).toFixed(1)}M`, label: "YTD Spend", tone: "dark" },
                  { value: `$${(financial.ytdBudget / 1_000_000).toFixed(1)}M`, label: "YTD Budget", tone: "accent" },
                ]}
              />
              <div className="p-3.5">
                <p className="font-display text-[13px] font-semibold text-slate-800">
                  Portfolio Capex
                </p>
                <p className="text-[11px] text-slate-400 mb-0.5">
                  Approved vs Actual vs Forecast ($M) by project
                </p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={capexData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }} barGap={4}>
                    <CartesianGrid vertical={false} stroke="#eef2f7" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10.5, fill: "#64748b" }}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10.5, fill: "#64748b" }} />
                    <Tooltip
                      cursor={{ fill: "rgba(15,23,42,0.04)" }}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10.5 }} iconType="circle" iconSize={7} />
                    <Bar dataKey="Approved" fill={SLATE} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Actual" fill={DARK} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Forecast" fill={ACCENT} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-3.5">
              <p className="font-display text-[13px] font-semibold text-slate-800">
                Portfolio Snapshot
              </p>
              <p className="text-[11px] text-slate-400 mb-2">by project</p>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-200">
                    <th className="font-medium pb-2">Project</th>
                    <th className="font-medium pb-2">Slip</th>
                    <th className="font-medium pb-2">Sprint</th>
                    <th className="font-medium pb-2">Capex</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshotRows.map((r, i) => (
                    <tr key={r.name} className={i % 2 === 1 ? "bg-slate-50" : ""}>
                      <td className="py-2 pr-2 text-slate-700 font-medium">{shortName(r.name)}</td>
                      <td className="py-2">
                        {r.slip > 0 ? (
                          <span className="text-amber-600 font-semibold">+{r.slip}d</span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">On time</span>
                        )}
                      </td>
                      <td className="py-2">
                        <Badge value={r.sprint} />
                      </td>
                      <td className="py-2">
                        <Badge value={r.capex} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <DashCard
              title="Schedule Slippage"
              subtitle="days by project"
              tiles={[
                { value: `${maxSlip}d`, label: "Max Slippage", tone: "dark" },
                { value: `${planning.projects.length}`, label: "Active Projects", tone: "accent" },
              ]}
            >
              <HBarChart data={slippageData} valueSuffix="d" />
            </DashCard>

            <DashCard
              title="Signal Confidence"
              subtitle="% by project"
              tiles={[
                { value: `${risk.flags.length}`, label: "Active Flags", tone: "dark" },
                { value: `${highSeverityCount}`, label: "High Severity", tone: "accent" },
              ]}
            >
              <HBarChart data={riskData} valueSuffix="%" />
            </DashCard>

            <DashCard
              title="Forecast vs Approved"
              subtitle="% overrun by project"
              tiles={[
                { value: `$${(financial.portfolioCapex / 1_000_000).toFixed(1)}M`, label: "Portfolio Capex", tone: "dark" },
                { value: `+${financial.variancePct}%`, label: "YTD Variance", tone: "accent" },
              ]}
            >
              <HBarChart data={overrunData} valueSuffix="%" />
            </DashCard>

            <DashCard
              title="Velocity vs Target"
              subtitle="% of target by project"
              tiles={[
                { value: `${totalDefects}`, label: "Open Defects", tone: "dark" },
                { value: `${criticalDefects}`, label: "Critical", tone: "accent" },
              ]}
            >
              <HBarChart data={velocityData} valueSuffix="%" />
            </DashCard>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 min-h-56">
            <div className="flex items-center gap-2 mb-4">
              <p className="font-display text-[13px] font-semibold text-slate-800">
                Executive Agent — AI-Generated Brief
              </p>
              {generated && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                  <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
                  Generated
                </span>
              )}
            </div>

            {!brief && !loading && (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <p className="text-[13px] text-slate-400">
                  Click{" "}
                  <span className="text-slate-600 font-medium">Generate Executive Brief</span>{" "}
                  above to synthesize all agent outputs
                </p>
              </div>
            )}

            {briefSections.length > 0 && (
              <div className="max-w-3xl space-y-3">
                {briefSections.map((section, i) => {
                  const Icon = BRIEF_SECTION_ICONS[section.title.toLowerCase()];
                  return (
                    <div
                      key={`${section.title}-${i}`}
                      className="rounded-lg border border-slate-200 bg-slate-50/70 p-4"
                    >
                      {section.title && (
                        <div className="flex items-center gap-2 mb-2.5">
                          {Icon && (
                            <Icon className="h-3.5 w-3.5 text-violet-600" strokeWidth={2} />
                          )}
                          <h3 className="text-[11px] font-semibold tracking-[0.06em] text-slate-700 uppercase">
                            {section.title}
                          </h3>
                        </div>
                      )}
                      <ReactMarkdown components={briefBodyComponents}>
                        {section.body}
                      </ReactMarkdown>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-center text-slate-400 text-xs mt-6">
            Powered by Claude · Multi-Agent PMO System · Prototype v1.0
          </p>
        </div>
      </main>
    </div>
  );
}
