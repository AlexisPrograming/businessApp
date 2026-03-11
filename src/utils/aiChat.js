/**
 * Clearpath Finance — AI Chat API (Anthropic)
 * API key from env, error handling, streaming, prompt injection filtering
 */

import { sanitizePrompt } from "./sanitizers.js";
import { getWeeklySpendByDay } from "./financeCalculations.js";
import { MODELS } from "../constants/defaults.js";

function getApiKey() {
  try {
    return import.meta.env?.VITE_ANTHROPIC_API_KEY ?? "";
  } catch (e) {
    return "";
  }
}

export function hasAiApiKey() {
  const key = getApiKey();
  return typeof key === "string" && key.trim().length > 0;
}

/**
 * Build safe financial context (aggregates only, no raw PII)
 */
export function buildFinancialContext(transactions, categories, financialData) {
  const safeTx = Array.isArray(transactions) ? transactions : [];
  const totalSpent = safeTx.reduce((s, t) => s + (typeof t.amount === "number" ? t.amount : 0), 0);
  const byCat = {};
  safeTx.forEach((t) => {
    const name = t.category && String(t.category).trim() ? t.category : "Other";
    byCat[name] = (byCat[name] || 0) + (typeof t.amount === "number" ? t.amount : 0);
  });
  const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
  const weeklySpend = getWeeklySpendByDay(safeTx);
  const weekTotal = weeklySpend.reduce((s, v) => s + v, 0);
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const data = financialData || {};
  const monthBudget = data.monthBudget ?? 3800;
  const savingsGoal = data.savingsGoal ?? 12000;
  const savedSoFar = data.savedSoFar ?? 0;
  const monthlyIncome = data.monthlyIncome ?? 6200;

  return {
    totalTransactions: safeTx.length,
    totalSpentThisMonth: Math.round(totalSpent * 100) / 100,
    monthlyBudget: monthBudget,
    budgetUsedPct: monthBudget > 0 ? Math.round((totalSpent / monthBudget) * 100) : 0,
    remainingBudget: Math.round((monthBudget - totalSpent) * 100) / 100,
    topCategory: topCat ? { name: topCat[0], amount: Math.round(topCat[1] * 100) / 100 } : null,
    categoryBreakdown: Object.entries(byCat)
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount]) => ({ name, amount: Math.round(amount * 100) / 100 })),
    weeklySpendByDay: weeklySpend.map((v, i) => ({ day: dayNames[i], amount: Math.round(v * 100) / 100 })),
    weeklyTotal: Math.round(weekTotal * 100) / 100,
    savingsGoal,
    savedSoFar,
    savingsPct: savingsGoal > 0 ? Math.round((savedSoFar / savingsGoal) * 100) : 0,
    remainingToGoal: savingsGoal - savedSoFar,
    monthlyIncome,
    netMonthly: monthlyIncome - totalSpent,
  };
}

export function buildSystemPrompt(ctx) {
  return `You are a warm, expert personal financial assistant embedded in the Clearpath finance app.

FINANCIAL SUMMARY (aggregate data only — no raw account details):
${JSON.stringify(ctx, null, 2)}

RESPONSE RULES:
- Be concise (under 200 words), warm, and specific — cite real numbers from the summary above.
- Give actionable advice with concrete next steps.
- Never request sensitive info (account numbers, SSN, passwords, PINs).
- Never make definitive predictions about markets or returns.
- Format key figures with $ and % for clarity.
- If the user asks something outside finance, gently redirect.`;
}

function classifyQuery(text) {
  const deep = [
    "analyz", "strateg", "recommend", "project", "trend", "anomal",
    "invest", "plan", "compare", "explain", "why", "how much", "should i",
    "forecast", "optimize", "report", "breakdown", "detail",
  ];
  const lower = String(text).toLowerCase();
  const isComplex = deep.some((kw) => lower.includes(kw)) || text.length > 80;
  return {
    model: isComplex ? MODELS.smart : MODELS.fast,
    useThinking: isComplex && text.length > 60,
    label: isComplex ? "Deep Analysis" : "Quick Answer",
  };
}

/**
 * Stream a response from Anthropic API. onChunk(finalText), onDone(finalText), onError(message).
 */
export async function streamMessage({
  systemPrompt,
  messages,
  model,
  useThinking,
  onChunk,
  onDone,
  onError,
}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    const msg = "AI is not configured. Add VITE_ANTHROPIC_API_KEY to your .env file.";
    if (import.meta.env?.DEV) console.warn("[Clearpath] AI:", msg);
    onError?.(msg);
    return;
  }

  try {
    const body = {
      model: model || MODELS.smart,
      max_tokens: useThinking ? 8000 : 1000,
      stream: true,
      system: [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: Array.isArray(messages) ? messages : [],
    };
    if (useThinking) {
      body.thinking = { type: "enabled", budget_tokens: 3000 };
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "prompt-caching-2024-07-31",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const msg = errBody?.error?.message || `HTTP ${response.status}`;
      if (import.meta.env?.DEV) console.warn("[Clearpath] AI API error:", msg);
      onError?.(msg);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError?.("No response body");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let assembled = "";
    let inThinkingBlock = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") continue;
        try {
          const evt = JSON.parse(raw);
          if (evt.type === "content_block_start") {
            inThinkingBlock = evt.content_block?.type === "thinking";
          }
          if (evt.type === "content_block_stop") {
            inThinkingBlock = false;
          }
          if (evt.type === "content_block_delta" && !inThinkingBlock) {
            const delta = evt.delta?.text || evt.delta?.partial_json || "";
            assembled += delta;
            onChunk?.(assembled);
          }
        } catch {
          // skip malformed line
        }
      }
    }
    onDone?.(assembled || "I couldn't generate a response. Please try again.");
  } catch (err) {
    const msg = err?.message || "Connection issue. Please try again.";
    if (import.meta.env?.DEV) console.warn("[Clearpath] AI stream error:", msg);
    onError?.(msg);
  }
}

/**
 * Sanitize user input before sending to AI (export for use in panel)
 */
export { sanitizePrompt };

/**
 * Get model config for a user message
 */
export function getModelForQuery(text) {
  return classifyQuery(text);
}
