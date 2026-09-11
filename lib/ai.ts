import Anthropic from '@anthropic-ai/sdk';
import { classificationSchema } from '@/lib/validators';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

/** Strip stray ``` fences some models add even when told not to. */
function cleanJson(text: string): string {
  return text.replace(/^```(json)?/gm, '').replace(/```$/gm, '').trim();
}

// ---------------------------------------------------------------------------
// AI1 — Structured classification (see brief §9.1)
// ---------------------------------------------------------------------------
export async function classifyFeedback(content: string, existingThemes: string[]) {
  const prompt = `You are a product-feedback analyst. Classify the following customer
feedback item. Reuse one of the EXISTING THEMES below whenever the feedback genuinely
fits one; only propose a new theme name if nothing fits.

EXISTING THEMES: ${existingThemes.length ? existingThemes.join(', ') : '(none yet)'}

FEEDBACK: """${content}"""

Return ONLY valid JSON (no markdown fences, no commentary) matching exactly this shape:
{
  "sentiment": "POS" | "NEU" | "NEG",
  "sentimentScore": number between -1 and 1,
  "themes": string[] (1-3 short theme names, Title Case),
  "featureArea": string (one short label, e.g. "Onboarding", "Billing", "Mobile App"),
  "rationale": string (one short sentence explaining the call)
}`;

  const attempt = async () => {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n');
    const parsed = JSON.parse(cleanJson(text));
    return classificationSchema.parse(parsed);
  };

  try {
    return await attempt();
  } catch {
    // Retry once (brief §9.1: "retry once, then flag for manual review").
    try {
      return await attempt();
    } catch {
      return null; // caller should mark the item for manual review
    }
  }
}

// ---------------------------------------------------------------------------
// AI3 — Retrieval-grounded Q&A ("Ask LOOP", see brief §9.2)
// ---------------------------------------------------------------------------
export async function answerFromFeedback(
  question: string,
  contextItems: { id: string; content: string; channel: string; sentiment: string | null }[]
) {
  const context = contextItems
    .map((it, i) => `[${i + 1}] (${it.channel}, ${it.sentiment ?? 'unknown'}): ${it.content}`)
    .join('\n');

  const prompt = `You are Ask LOOP, an assistant that answers ONLY from the customer
feedback provided below. Never invent feedback that isn't in the context. If the
context doesn't contain enough information to answer, say so plainly.

FEEDBACK CONTEXT:
${context || '(no relevant feedback found)'}

QUESTION: ${question}

Answer concisely in 2-4 sentences, then list the item numbers (e.g. "[1], [3]") you
relied on. Return plain text, not JSON.`;

  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
}

// ---------------------------------------------------------------------------
// AI4 — Voice-of-Customer report narrative (see brief §9.3)
// ---------------------------------------------------------------------------
export async function generateVoCNarrative(stats: {
  periodLabel: string;
  totalItems: number;
  sentimentBreakdown: Record<string, number>;
  topThemes: { name: string; count: number; deltaPct: number }[];
  sampleQuotes: string[];
}) {
  const prompt = `You are writing a Voice-of-Customer digest for a Head of Product.
Use ONLY the pre-computed stats below — do not invent numbers. Write a short,
professional narrative (title, 3-4 short sections: Overview, Top Themes,
Notable Quotes, Recommended Actions). Keep it under 350 words total.

STATS (already computed, treat as ground truth):
${JSON.stringify(stats, null, 2)}

Return plain text with simple markdown headings (##), not JSON.`;

  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 700,
    messages: [{ role: 'user', content: prompt }],
  });

  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
}
