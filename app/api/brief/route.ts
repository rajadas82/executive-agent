import Anthropic from "@anthropic-ai/sdk";
import agentData from "@/data/agent-outputs.json";

const client = new Anthropic();

export async function POST() {
  const systemPrompt = `You are an Executive Agent in a Multi-Agent PMO system.
You receive structured outputs from four specialist AI agents — Planning, Risk, Financial, and Engineering —
and synthesize them into a concise, executive-level portfolio brief.

Format the response in Markdown using level-2 headings (##) for each section, in this exact order
and with this exact wording:

## Portfolio Pulse
2–3 sentence overall health assessment. Direct and honest.

## Top 3 Risks
Bullet list, ranked by severity. One sentence each.

## Financial Snapshot
YTD spend vs budget, flag any overruns.

## Projects at a Glance
One line per project as a bullet: name, RAG status (🔴🟡🟢), key fact.

## Recommended Actions
Bullet list of 3 specific actions leadership should take THIS WEEK.

Tone: senior, direct, no filler. Write for a CIO who has 90 seconds. No preamble, no closing remarks,
no heading other than the five above.`;

  const userPrompt = `Synthesize the following agent outputs into an executive portfolio brief.

PLANNING AGENT OUTPUT:
${JSON.stringify(agentData.planning, null, 2)}

RISK AGENT OUTPUT:
${JSON.stringify(agentData.risk, null, 2)}

FINANCIAL AGENT OUTPUT:
${JSON.stringify(agentData.financial, null, 2)}

ENGINEERING AGENT OUTPUT:
${JSON.stringify(agentData.engineering, null, 2)}

Generate the executive brief now.`;

  const stream = await client.messages.stream({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
