/**
 * Clearpath Finance — Financial calculations (memoizable)
 * Weekly spend by day, category totals, budget %, etc.
 */

import { getWeekRange } from "./dateHelpers.js";

/**
 * Spending per day for current week (Mon–Sun), from transactions with isoDate
 */
export function getWeeklySpendByDay(transactions) {
  if (!Array.isArray(transactions)) return [0, 0, 0, 0, 0, 0, 0];
  const { monday } = getWeekRange();
  const days = [0, 0, 0, 0, 0, 0, 0];
  transactions.forEach((tx) => {
    const iso = tx.isoDate;
    if (!iso) return;
    const txDate = new Date(iso);
    const diff = Math.floor((txDate - monday) / 86400000);
    if (diff >= 0 && diff < 7) {
      const amount = typeof tx.amount === "number" && !isNaN(tx.amount) ? tx.amount : 0;
      days[diff] += amount;
    }
  });
  return days;
}

/**
 * Total spent from transactions (optionally filter by predicate, e.g. current month)
 */
export function getTotalSpent(transactions, predicate = null) {
  if (!Array.isArray(transactions)) return 0;
  const list = predicate ? transactions.filter(predicate) : transactions;
  return list.reduce((sum, tx) => {
    const amt = typeof tx.amount === "number" && !isNaN(tx.amount) ? tx.amount : 0;
    return sum + amt;
  }, 0);
}

/**
 * Category totals: { categoryName: totalAmount }
 */
export function getCategoryTotals(transactions, predicate = null) {
  if (!Array.isArray(transactions)) return {};
  const list = predicate ? transactions.filter(predicate) : transactions;
  const byCat = {};
  list.forEach((tx) => {
    const name = tx.category && String(tx.category).trim() ? tx.category : "Other";
    const amount = typeof tx.amount === "number" && !isNaN(tx.amount) ? tx.amount : 0;
    byCat[name] = (byCat[name] || 0) + amount;
  });
  return byCat;
}

/**
 * Current month predicate for transaction isoDate
 */
export function currentMonthPredicate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return (tx) => {
    if (!tx.isoDate) return false;
    const d = new Date(tx.isoDate);
    return d.getFullYear() === y && d.getMonth() === m;
  };
}

/**
 * Compute balance from starting balance and transactions (spending subtracts)
 */
export function computeBalance(initialBalance, transactions, predicate = null) {
  const spent = getTotalSpent(transactions, predicate);
  const num = parseFloat(initialBalance);
  const start = isNaN(num) ? 0 : num;
  return Math.round((start - spent) * 100) / 100;
}
