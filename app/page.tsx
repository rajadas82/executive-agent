"use client";

import { useState, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import agentData from "@/data/agent-outputs.json";

const SECTION_ICONS: Record<string, string> = {
  "portfolio pulse": "📊",
  "top 3 risks": "⚠️",
  "financial snapshot": "💰",
  "projects at a glance": "📁",
  "recommended actions": "✅",
};

function headingText(children: ReactNode): string {
  return Array.isArray(children) ? children.join("") : String(children ?? "");
}

const briefComponents: Components = {
  h2: ({ children }) => {
    const text = headingText(children);
    const icon = SECTION_ICONS[text.toLowerCase().trim()] ?? "▸";
    return (
      <div className="flex items-center gap-2 mt-7 mb-3 first:mt-0 pb-2 border-b border-indigo-900/60">
        <span className="text-base leading-none">{icon}</span>
        <h2 className="text-xs font-semibold tracking-wider text-teal-400 uppercase">
          {children}
        </h2>
      </div>
    );
  },
  p: ({ children }) => (
    <p className="text-sm text-slate-300 leading-relaxed mb-3">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-none pl-0 space-y-2 mb-4">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-none pl-0 space-y-2 mb-4">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="flex gap-2 text-sm text-slate-300 leading-relaxed">
      <span className="text-teal-500 mt-0.5 shrink-0">▸</span>
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => (
    <strong className="text-white font-semibold">{children}</strong>
  ),
};

const RAG: Record<string, string> = {
  RED: "bg-red-100 text-red-700 border border-red-200",
  AMBER: "bg-amber-100 text-amber-700 border border-amber-200",
  GREEN: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  HIGH: "bg-red-100 text-red-700 border border-red-200",
  MEDIUM: "bg-amber-100 text-amber-700 border border-amber-200",
  LOW: "bg-slate-100 text-slate-600 border border-slate-200",
  OVER: "bg-red-100 text-red-700 border border-red-200",
  ON_TRACK: "bg-emerald-100 text-emerald-700 border border-emerald-200",
};

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

  const { planning, risk, financial, engineering } = agentData;

  return (
    <main className="min-h-screen bg-[#0b1020] text-slate-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8 border-b border-indigo-900/50 pb-6">
          <div>
            <p className="text-xs font-semibold tracking-widest text-teal-400 uppercase mb-1">
              Multi-Agent PMO System
            </p>
            <h1 className="text-3xl font-light text-white">
              Executive Intelligence Hub
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              As of {planning.asOf} · Portfolio: $
              {(financial.portfolioCapex / 1_000_000).toFixed(1)}M Capex ·{" "}
              {planning.projects.length} Active Projects
            </p>
          </div>
          <button
            onClick={generateBrief}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-semibold rounded-lg transition-all text-sm"
          >
            {loading ? (
              <>
                <span className="animate-spin">⟳</span> Generating…
              </>
            ) : (
              <>⚡ Generate Executive Brief</>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
          <div className="bg-[#111731] border border-indigo-900/50 rounded-xl p-4">
            <p className="text-xs font-semibold tracking-wider text-teal-400 uppercase mb-3">
              Planning Agent
            </p>
            <div className="space-y-2">
              {planning.projects.map((p) => (
                <div key={p.name} className="text-xs">
                  <p className="text-slate-200 font-medium truncate">{p.name}</p>
                  <p className="text-slate-500">
                    {p.slippageDays > 0 ? (
                      <span className="text-amber-400">+{p.slippageDays}d slip</span>
                    ) : (
                      <span className="text-emerald-400">On schedule</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#111731] border border-indigo-900/50 rounded-xl p-4">
            <p className="text-xs font-semibold tracking-wider text-orange-400 uppercase mb-3">
              Risk Agent
            </p>
            <div className="space-y-2">
              {risk.flags.map((f) => (
                <div key={f.project} className="text-xs">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${RAG[f.severity]}`}>
                    {f.severity}
                  </span>
                  <p className="text-slate-400 mt-0.5 truncate">{f.project}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#111731] border border-indigo-900/50 rounded-xl p-4">
            <p className="text-xs font-semibold tracking-wider text-amber-400 uppercase mb-3">
              Financial Agent
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">YTD Spend</span>
                <span className="text-slate-200 font-medium">${(financial.ytdSpend / 1_000_000).toFixed(1)}M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">YTD Budget</span>
                <span className="text-slate-200 font-medium">${(financial.ytdBudget / 1_000_000).toFixed(1)}M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Variance</span>
                <span className="text-red-400 font-semibold">+{financial.variancePct}%</span>
              </div>
            </div>
          </div>

          <div className="bg-[#111731] border border-indigo-900/50 rounded-xl p-4">
            <p className="text-xs font-semibold tracking-wider text-purple-400 uppercase mb-3">
              Engineering Agent
            </p>
            <div className="space-y-2">
              {engineering.projects.map((p) => (
                <div key={p.name} className="flex items-center gap-2 text-xs">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${RAG[p.sprintHealth]}`}>
                    {p.sprintHealth}
                  </span>
                  <span className="text-slate-400 truncate">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#111731] border border-indigo-900/50 rounded-xl p-6 min-h-64">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Executive Agent — AI-Generated Brief
            </p>
            {generated && (
              <span className="text-xs text-emerald-400 font-medium">✓ Generated</span>
            )}
          </div>

          {!brief && !loading && (
            <div className="flex flex-col items-center justify-center h-40 text-slate-600">
              <p className="text-sm">
                Click <span className="text-teal-400">Generate Executive Brief</span> to synthesize all agent outputs
              </p>
            </div>
          )}

          {brief && (
            <div className="max-w-2xl">
              <ReactMarkdown components={briefComponents}>{brief}</ReactMarkdown>
            </div>
          )}
        </div>

        <p className="text-center text-slate-700 text-xs mt-6">
          Powered by Claude · Multi-Agent PMO System · Prototype v1.0
        </p>
      </div>
    </main>
  );
}
