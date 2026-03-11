/**
 * Clearpath Finance — Default data and design constants
 * DO NOT change colors or UI values; treat as design system reference.
 */

export const BASE_TRANSACTIONS = [
  { id: 1, merchant: "Whole Foods Market", amount: 84.32, date: "Mar 7", isoDate: "2026-03-07", category: "Food", icon: "🛒", notes: "" },
  { id: 2, merchant: "Shell Gas Station", amount: 62.0, date: "Mar 6", isoDate: "2026-03-06", category: "Transport", icon: "⛽", notes: "" },
  { id: 3, merchant: "Amazon Purchase", amount: 47.99, date: "Mar 6", isoDate: "2026-03-06", category: "Shopping", icon: "📦", notes: "" },
  { id: 4, merchant: "Chipotle", amount: 14.5, date: "Mar 5", isoDate: "2026-03-05", category: "Food", icon: "🌯", notes: "" },
  { id: 5, merchant: "Uber Ride", amount: 22.8, date: "Mar 5", isoDate: "2026-03-05", category: "Transport", icon: "🚗", notes: "" },
  { id: 6, merchant: "Target", amount: 138.0, date: "Mar 4", isoDate: "2026-03-04", category: "Shopping", icon: "🎯", notes: "" },
  { id: 7, merchant: "Starbucks", amount: 6.75, date: "Mar 4", isoDate: "2026-03-04", category: "Food", icon: "☕", notes: "" },
  { id: 8, merchant: "Planet Fitness", amount: 10.0, date: "Mar 3", isoDate: "2026-03-03", category: "Health", icon: "🏋️", notes: "" },
  { id: 9, merchant: "Netflix", amount: 15.99, date: "Mar 3", isoDate: "2026-03-03", category: "Subscriptions", icon: "🎬", notes: "" },
  { id: 10, merchant: "Spotify", amount: 9.99, date: "Mar 3", isoDate: "2026-03-03", category: "Subscriptions", icon: "🎵", notes: "" },
];

/** Default category ids that cannot be deleted */
export const DEFAULT_CATEGORY_IDS = ["food", "transport", "housing", "shopping", "entertainment", "health", "subscriptions", "other"];

export function isDefaultCategory(id) {
  return DEFAULT_CATEGORY_IDS.includes(id);
}

export const DEFAULT_CATEGORIES = [
  { id: "food", name: "Food", color: "#C4A882", icon: "🍽️" },
  { id: "transport", name: "Transport", color: "#A67C52", icon: "🚗" },
  { id: "housing", name: "Housing", color: "#E8D5B7", icon: "🏠" },
  { id: "shopping", name: "Shopping", color: "#8B5E3C", icon: "🛍️" },
  { id: "entertainment", name: "Entertainment", color: "#5C3D2E", icon: "🎭" },
  { id: "health", name: "Health", color: "#6B9B6B", icon: "💊" },
  { id: "subscriptions", name: "Subscriptions", color: "#7B6B5B", icon: "📱" },
  { id: "other", name: "Other", color: "#9B8878", icon: "📌" },
];

export const DEFAULT_FINANCIAL_DATA = {
  balance: 4823.5,
  monthlyIncome: 6200,
  monthSpent: 2841.2,
  monthBudget: 3800,
  savingsGoal: 12000,
  savedSoFar: 7340,
  upcomingBills: [
    { name: "Rent", amount: 1450, due: 3, icon: "🏠" },
    { name: "Netflix", amount: 15.99, due: 7, icon: "🎬" },
    { name: "Spotify", amount: 9.99, due: 12, icon: "🎵" },
    { name: "Gym", amount: 45, due: 15, icon: "💪" },
  ],
  plans: [
    { id: 0, tag: "Flexible", title: "Save Without Sacrifice", desc: "Small weekly targets, minimal lifestyle changes.", monthly: 420, pressure: 1, color: "#C4A882" },
    { id: 1, tag: "Structured", title: "Build Real Momentum", desc: "Moderate spending limits. Reach your goal 2× faster.", monthly: 860, pressure: 2, color: "#A67C52" },
    { id: 2, tag: "Freedom", title: "Aggressive Wealth Mode", desc: "Strict targets, investment focus.", monthly: 1540, pressure: 3, color: "#5C3D2E" },
  ],
};

export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Mono:wght@300;400&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { display: none; }
  body { background: #FAF7F2; }
  button { transition: opacity 0.2s, transform 0.1s; }
  button:hover { opacity: 0.88; }
  button:active { transform: scale(0.97); }
  input, textarea { outline: none; font-family: inherit; }
  .fade-in { animation: fadeIn 0.35s ease both; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  .chat-bubble-in { animation: bubbleIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both; }
  @keyframes bubbleIn { from { opacity: 0; transform: scale(0.88) translateY(10px); } to { opacity: 1; transform: none; } }
  .modal-slide { animation: slideUp 0.3s cubic-bezier(0.34,1.2,0.64,1) both; }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: none; } }
`;

/** AI model identifiers */
export const MODELS = {
  fast: "claude-haiku-4-5-20251001",
  smart: "claude-sonnet-4-6",
};
