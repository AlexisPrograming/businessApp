import { useState, useMemo, useCallback } from "react";
import { useTransactions } from "../hooks/useTransactions.js";
import { useCategories } from "../hooks/useCategories.js";
import { useFinance } from "../hooks/useFinance.js";
import { useUserProfile } from "../hooks/useUserProfile.js";
import { useSettings } from "../hooks/useSettings.js";
import { GLOBAL_CSS } from "../constants/defaults.js";
import { TransactionModal } from "./modals/TransactionModal.jsx";
import { AddTransactionModal } from "./modals/AddTransactionModal.jsx";
import { CategoriesModal } from "./modals/CategoriesModal.jsx";
import { BankModal } from "./modals/BankModal.jsx";
import { ProfileEditModal } from "./modals/ProfileEditModal.jsx";
import { AIChatPanel } from "./AIChatPanel.jsx";
import { AnimatedNumber } from "./ui/AnimatedNumber.jsx";
import { DonutChart } from "./charts/DonutChart.jsx";
import { SparkBar } from "./charts/SparkBar.jsx";
import { Toggle } from "./ui/Toggle.jsx";
import { PressureDots } from "./ui/PressureDots.jsx";

const TABS = ["Home", "Spend", "Save", "Insights", "Profile"];
const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function MainApp({ user, onLogout }) {
  const [tab, setTab] = useState(0);
  const [editingTx, setEditingTx] = useState(null);
  const [showAddTx, setShowAddTx] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showCatsModal, setShowCatsModal] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(1);
  const [recentlyCorrected, setRecentlyCorrected] = useState([]);

  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { categories, setCategories } = useCategories();
  const { financialData, derived, updateFinancialData } = useFinance(transactions);
  const { userProfile, updateProfile } = useUserProfile(user);
  const {
    biometricEnabled,
    aiNotifications,
    connectedBanks,
    setBiometricEnabled,
    setAiNotifications,
    addConnectedBank,
  } = useSettings();

  const displayName = useMemo(() => {
    const name = userProfile?.name ?? "Alex";
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : "Alex";
  }, [userProfile?.name]);

  const weeklySpend = derived.weeklySpendByDay ?? [0, 0, 0, 0, 0, 0, 0];
  const weekTotal = useMemo(() => weeklySpend.reduce((s, v) => s + v, 0), [weeklySpend]);
  const maxDayIdx = useMemo(() => weeklySpend.indexOf(Math.max(...weeklySpend)), [weeklySpend]);

  const categoryTotals = derived.categoryTotals ?? {};
  const totalSpent = useMemo(
    () => Object.values(categoryTotals).reduce((s, v) => s + v, 0),
    [categoryTotals]
  );
  const dynamicCategories = useMemo(() => {
    const list = Array.isArray(categories) ? categories : [];
    return list
      .map((c) => ({
        ...c,
        amount: categoryTotals[c.name] || 0,
        pct: totalSpent > 0 ? Math.round(((categoryTotals[c.name] || 0) / totalSpent) * 100) : 0,
      }))
      .filter((c) => c.amount > 0);
  }, [categories, categoryTotals, totalSpent]);

  const budgetPct = derived.budgetPct ?? 0;
  const savingsPct = derived.savingsPct ?? 0;

  const handleSaveTx = useCallback(
    (updated) => {
      updateTransaction(updated);
      setRecentlyCorrected((prev) => [...new Set([...prev, updated.id])]);
      setEditingTx(null);
    },
    [updateTransaction]
  );

  const handleDeleteTx = useCallback(
    (id) => {
      deleteTransaction(id);
      setEditingTx(null);
    },
    [deleteTransaction]
  );

  const handleAddTx = useCallback(
    (tx) => {
      addTransaction(tx);
      setShowAddTx(false);
    },
    [addTransaction]
  );

  const handleSaveProfile = useCallback(
    (data) => {
      updateProfile(data);
    },
    [updateProfile]
  );

  if (import.meta.env?.DEV) {
    if (transactions == null) console.warn("[Clearpath] transactions is null");
    if (categories == null) console.warn("[Clearpath] categories is null");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAF7F2",
        fontFamily: "'Georgia', serif",
        maxWidth: 480,
        margin: "0 auto",
        position: "relative",
      }}
    >
      <style>{GLOBAL_CSS}</style>

      {editingTx && (
        <TransactionModal
          tx={editingTx}
          categories={categories}
          onSave={handleSaveTx}
          onDelete={handleDeleteTx}
          onClose={() => setEditingTx(null)}
        />
      )}
      {showAddTx && (
        <AddTransactionModal categories={categories} onSave={handleAddTx} onClose={() => setShowAddTx(false)} />
      )}
      {showBankModal && (
        <BankModal onClose={() => setShowBankModal(false)} onConnect={addConnectedBank} />
      )}
      {showCatsModal && (
        <CategoriesModal categories={categories} onChange={setCategories} onClose={() => setShowCatsModal(false)} />
      )}
      {showProfileEdit && (
        <ProfileEditModal
          profile={userProfile}
          onSave={handleSaveProfile}
          onClose={() => setShowProfileEdit(false)}
        />
      )}
      {showAI && (
        <AIChatPanel
          transactions={transactions}
          categories={categories}
          financialData={financialData}
          onClose={() => setShowAI(false)}
        />
      )}

      <div style={{ background: "#2C1A0E", padding: "18px 24px 0", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: 3,
                color: "#A67C52",
                fontFamily: "'DM Mono', monospace",
                textTransform: "uppercase",
              }}
            >
              Clearpath
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", color: "#FAF7F2", fontSize: 17, marginTop: 2 }}>
              {tab === 0
                ? `Good ${
                    new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"
                  }, ${displayName}`
                : tab === 1
                  ? "Spending"
                  : tab === 2
                    ? "Savings"
                    : tab === 3
                      ? "Insights"
                      : "Profile"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={() => setShowAI(true)}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "none",
                background: "rgba(166,124,82,0.3)",
                color: "#E8D5B7",
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="AI Assistant"
            >
              ✦
            </button>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#A67C52",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Playfair Display', serif",
                color: "#FAF7F2",
                fontSize: 15,
                cursor: "pointer",
              }}
              onClick={() => setTab(4)}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 0 }}>
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              style={{
                flex: 1,
                padding: "10px 2px",
                border: "none",
                background: "transparent",
                fontFamily: "'DM Mono', monospace",
                fontSize: 9,
                letterSpacing: 1,
                color: tab === i ? "#E8D5B7" : "#6B5B4E",
                textTransform: "uppercase",
                cursor: "pointer",
                borderBottom: tab === i ? "2px solid #A67C52" : "2px solid transparent",
                transition: "all 0.2s ease",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "22px 20px 100px" }} className="fade-in">
        {/* ── HOME ── */}
        {tab === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                background: "#2C1A0E",
                borderRadius: 20,
                padding: "28px 24px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  right: -20,
                  top: -20,
                  width: 140,
                  height: 140,
                  borderRadius: "50%",
                  background: "rgba(166,124,82,0.12)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: 30,
                  bottom: -30,
                  width: 90,
                  height: 90,
                  borderRadius: "50%",
                  background: "rgba(166,124,82,0.06)",
                }}
              />
              <div
                style={{
                  fontSize: 10,
                  color: "#A67C52",
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Current Balance
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 44, color: "#FAF7F2", marginBottom: 4 }}>
                <AnimatedNumber value={financialData.balance ?? 0} prefix="$" decimals={2} />
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#6B5B4E" }}>
                ↑ $340 more saved than last month
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 20 }}>
                {[
                  { label: "Monthly In", val: `$${(financialData.monthlyIncome ?? 0).toLocaleString()}` },
                  { label: "Monthly Out", val: `$${(financialData.monthSpent ?? 0).toLocaleString()}` },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: 10,
                      padding: "10px 14px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        color: "#6B5B4E",
                        fontFamily: "'DM Mono', monospace",
                        letterSpacing: 2,
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      {s.label}
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, color: "#E8D5B7" }}>
                      {s.val}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 16, padding: "20px", border: "1px solid #F0EAE0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#2C1A0E" }}>
                  Monthly Budget
                </div>
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    color: budgetPct > 80 ? "#A67C52" : "#9B8878",
                  }}
                >
                  {budgetPct}% used
                </div>
              </div>
              <div style={{ height: 8, background: "#F0EAE0", borderRadius: 4, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: 4,
                    width: `${Math.min(budgetPct, 100)}%`,
                    background: budgetPct > 85 ? "linear-gradient(90deg, #A67C52, #C4A882)" : "#C4A882",
                    transition: "width 1.2s ease",
                  }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9B8878" }}>
                  ${(financialData.monthSpent ?? 0).toLocaleString()} spent
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9B8878" }}>
                  ${(financialData.monthBudget ?? 0).toLocaleString()} limit
                </div>
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 16, padding: "20px", border: "1px solid #F0EAE0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#2C1A0E" }}>
                  This Week
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#A67C52" }}>
                  ${weekTotal.toFixed(0)} total
                </div>
              </div>
              <SparkBar values={weeklySpend} highlightToday />
              {weekTotal > 0 && (
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    color: "#9B8878",
                    marginTop: 12,
                    letterSpacing: 0.5,
                  }}
                >
                  {dayNames[maxDayIdx].toUpperCase()} WAS YOUR HIGHEST SPEND DAY — $
                  {Math.max(...weeklySpend).toFixed(0)}
                </div>
              )}
              {weekTotal === 0 && (
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#C4A882", marginTop: 12 }}>
                  No transactions this week yet
                </div>
              )}
            </div>

            <div style={{ background: "#fff", borderRadius: 16, padding: "20px", border: "1px solid #F0EAE0" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#2C1A0E", marginBottom: 14 }}>
                Upcoming Bills
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {(financialData.upcomingBills ?? []).map((b) => (
                  <div
                    key={b.name}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: "#FAF7F2",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16,
                        }}
                      >
                        {b.icon}
                      </div>
                      <div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#2C1A0E" }}>
                          {b.name}
                        </div>
                        <div
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 10,
                            color: b.due <= 3 ? "#A67C52" : "#C4A882",
                          }}
                        >
                          Due in {b.due} days
                        </div>
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#2C1A0E" }}>
                      ${(b.amount ?? 0).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowAI(true)}
              style={{
                background: "#2C1A0E",
                borderRadius: 16,
                padding: "18px 20px",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  color: "#A67C52",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                ✦ Ask Your AI Advisor
              </div>
              <div style={{ fontFamily: "'Georgia', serif", fontSize: 14, color: "#E8D5B7", lineHeight: 1.6 }}>
                Get personalized spending analysis, savings strategies, and financial Q&A. Tap to open your assistant
                →
              </div>
            </button>
          </div>
        )}

        {/* ── SPEND ── */}
        {tab === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                background: "#2C1A0E",
                borderRadius: 20,
                padding: "24px",
                display: "flex",
                alignItems: "center",
                gap: 24,
              }}
            >
              <DonutChart
                categories={
                  dynamicCategories.length > 0 ? dynamicCategories : [{ name: "No Data", pct: 100, color: "#E8D5B7" }]
                }
              />
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: "#A67C52",
                    fontFamily: "'DM Mono', monospace",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Total spent
                </div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: "#FAF7F2" }}>
                  ${totalSpent.toFixed(0)}
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#6B5B4E", marginTop: 4 }}>
                  {new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}
                </div>
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 16, padding: "20px", border: "1px solid #F0EAE0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#2C1A0E" }}>
                  By Category
                </div>
                <button
                  onClick={() => setShowCatsModal(true)}
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 9,
                    color: "#A67C52",
                    background: "none",
                    border: "1px solid #E8D5B7",
                    borderRadius: 8,
                    padding: "4px 10px",
                    cursor: "pointer",
                    letterSpacing: 1,
                  }}
                >
                  MANAGE
                </button>
              </div>
              {dynamicCategories.length === 0 && (
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#9B8878" }}>
                  No transactions yet.
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[...dynamicCategories].sort((a, b) => b.amount - a.amount).map((c) => (
                  <div key={c.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span>{c.icon}</span>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#2C1A0E" }}>
                          {c.name}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9B8878" }}>
                          {c.pct}%
                        </div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#2C1A0E" }}>
                          ${(c.amount ?? 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div style={{ height: 6, background: "#F0EAE0", borderRadius: 3, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          borderRadius: 3,
                          width: `${c.pct}%`,
                          background: c.color ?? "#C4A882",
                          transition: "width 1s ease",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 16, padding: "20px", border: "1px solid #F0EAE0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#2C1A0E" }}>
                  Transactions
                </div>
                <button
                  onClick={() => setShowAddTx(true)}
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 9,
                    color: "#5C3D2E",
                    background: "#FBF3EA",
                    border: "1px solid #E8D5B7",
                    borderRadius: 8,
                    padding: "5px 12px",
                    cursor: "pointer",
                    letterSpacing: 1,
                  }}
                >
                  + ADD
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {transactions.length === 0 && (
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#9B8878", padding: "12px 0" }}>
                    No transactions. Add one above.
                  </div>
                )}
                {transactions.map((tx) => (
                  <button
                    key={tx.id}
                    onClick={() => setEditingTx(tx)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 10px",
                      borderRadius: 10,
                      border: "none",
                      background: recentlyCorrected.includes(tx.id) ? "#F0F5EE" : "transparent",
                      cursor: "pointer",
                      transition: "background 0.2s",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 9,
                          background: "#FAF7F2",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 15,
                          border: "1px solid #F0EAE0",
                          flexShrink: 0,
                        }}
                      >
                        {tx.icon ?? "📌"}
                      </div>
                      <div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#2C1A0E" }}>
                          {tx.merchant}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                            marginTop: 2,
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'DM Mono', monospace",
                              fontSize: 9,
                              color: "#fff",
                              background: categories.find((c) => c.name === tx.category)?.color ?? "#C4A882",
                              borderRadius: 4,
                              padding: "2px 6px",
                            }}
                          >
                            {tx.category ?? "Other"}
                          </span>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#C4A882" }}>
                            {tx.date}
                          </span>
                          {tx.notes && (
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#9B8878" }}>
                              📝
                            </span>
                          )}
                          {recentlyCorrected.includes(tx.id) && (
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#6B9B6B" }}>
                              ✓ edited
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 15,
                        color: "#2C1A0E",
                        flexShrink: 0,
                      }}
                    >
                      −${(tx.amount ?? 0).toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SAVINGS ── */}
        {tab === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#2C1A0E", borderRadius: 20, padding: "28px 24px" }}>
              <div
                style={{
                  fontSize: 10,
                  color: "#A67C52",
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Savings Goal
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, color: "#FAF7F2", marginBottom: 4 }}>
                ${(financialData.savedSoFar ?? 0).toLocaleString()}{" "}
                <span style={{ fontSize: 16, color: "#6B5B4E" }}>
                  / ${(financialData.savingsGoal ?? 0).toLocaleString()}
                </span>
              </div>
              <div
                style={{
                  height: 8,
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: 4,
                  overflow: "hidden",
                  margin: "16px 0 8px",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 4,
                    width: `${Math.min(savingsPct, 100)}%`,
                    background: "linear-gradient(90deg, #A67C52, #E8D5B7)",
                    transition: "width 1.2s ease",
                  }}
                />
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#6B5B4E" }}>
                {savingsPct}% complete · Est. finish: August 2026
              </div>
            </div>

            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#2C1A0E" }}>
              Choose your savings approach
            </div>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: "#9B8878",
                letterSpacing: 1,
                marginTop: -8,
              }}
            >
              TAILORED TO YOUR INCOME & SPENDING
            </div>

            {(financialData.plans ?? []).map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                style={{
                  background: selectedPlan === plan.id ? "#2C1A0E" : "#fff",
                  border: selectedPlan === plan.id ? "2px solid #A67C52" : "2px solid #F0EAE0",
                  borderRadius: 16,
                  padding: "20px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 9,
                        letterSpacing: 2,
                        color: plan.color,
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      {plan.tag}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 18,
                        color: selectedPlan === plan.id ? "#FAF7F2" : "#2C1A0E",
                      }}
                    >
                      {plan.title}
                    </div>
                  </div>
                  <div
                    style={{
                      background: selectedPlan === plan.id ? "rgba(255,255,255,0.1)" : "#FAF7F2",
                      borderRadius: 10,
                      padding: "8px 12px",
                      textAlign: "right",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 9,
                        color: "#A67C52",
                        letterSpacing: 1,
                      }}
                    >
                      SAVE / MO
                    </div>
                    <div
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 20,
                        color: selectedPlan === plan.id ? "#E8D5B7" : "#2C1A0E",
                      }}
                    >
                      ${plan.monthly}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: 13,
                    color: selectedPlan === plan.id ? "#9B8878" : "#6B5B4E",
                    lineHeight: 1.5,
                    marginBottom: 12,
                  }}
                >
                  {plan.desc}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <PressureDots level={plan.pressure ?? 1} />
                  {selectedPlan === plan.id && (
                    <div
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 9,
                        color: "#A67C52",
                        letterSpacing: 2,
                      }}
                    >
                      ACTIVE ✓
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── INSIGHTS ── */}
        {tab === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#2C1A0E", marginBottom: 4 }}>
              Insights & Alerts
            </div>

            {(() => {
              const alerts = [];
              const foodAmount = categoryTotals["Food"] ?? 0;
              if (foodAmount > 200)
                alerts.push({
                  type: "warn",
                  msg: `Food spending is $${foodAmount.toFixed(0)} this month — ${foodAmount > 300 ? "significantly" : "slightly"} above average.`,
                });
              if (budgetPct > 80)
                alerts.push({
                  type: "warn",
                  msg: `You've used ${budgetPct}% of your monthly budget. Slow down in the remaining days.`,
                });
              if ((financialData.savedSoFar ?? 0) > 7000)
                alerts.push({
                  type: "good",
                  msg: `You're ${savingsPct}% of the way to your savings goal — on track for August 2026!`,
                });
              if (weekTotal > 500)
                alerts.push({
                  type: "warn",
                  msg: `You've spent $${weekTotal.toFixed(0)} this week. Consider slowing down.`,
                });
              if (alerts.length === 0)
                alerts.push({ type: "good", msg: "Your spending looks healthy this month. Keep it up!" });
              const styles = {
                warn: { bg: "#FBF3EA", border: "#E8D5B7", dot: "#A67C52", label: "ATTENTION" },
                info: { bg: "#F0EAE0", border: "#DDD0C0", dot: "#C4A882", label: "INFO" },
                good: { bg: "#F0F5EE", border: "#D0DFD0", dot: "#6B9B6B", label: "GREAT NEWS" },
              };
              return alerts.map((a, i) => {
                const s = styles[a.type] ?? styles.info;
                return (
                  <div
                    key={i}
                    style={{
                      background: s.bg,
                      border: `1px solid ${s.border}`,
                      borderRadius: 14,
                      padding: "16px 18px",
                      display: "flex",
                      gap: 14,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: s.dot,
                        marginTop: 5,
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 9,
                          color: s.dot,
                          letterSpacing: 2,
                          marginBottom: 4,
                        }}
                      >
                        {s.label}
                      </div>
                      <div style={{ fontFamily: "'Georgia', serif", fontSize: 14, color: "#2C1A0E", lineHeight: 1.5 }}>
                        {a.msg}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}

            <div style={{ background: "#2C1A0E", borderRadius: 16, padding: "20px", marginTop: 8 }}>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  color: "#A67C52",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                Spending Patterns
              </div>
              {[
                {
                  label: "Top category",
                  value: Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]
                    ? `${Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0][0]} ($${Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0][1].toFixed(0)})`
                    : "—",
                  icon: "📊",
                },
                { label: "Transactions", value: `${transactions.length} this month`, icon: "📋" },
                {
                  label: "Avg per transaction",
                  value: transactions.length > 0 ? `$${(totalSpent / transactions.length).toFixed(2)}` : "—",
                  icon: "💳",
                },
                { label: "Savings progress", value: `${savingsPct}% of goal`, icon: "🎯" },
              ].map((m) => (
                <div key={m.label} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 20 }}>{m.icon}</div>
                  <div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#E8D5B7" }}>
                      {m.label}
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#6B5B4E" }}>
                      {m.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowAI(true)}
              style={{
                background: "linear-gradient(135deg, #2C1A0E, #5C3D2E)",
                borderRadius: 16,
                padding: "20px",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  color: "#A67C52",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                ✦ Deep AI Analysis
              </div>
              <div style={{ fontFamily: "'Georgia', serif", fontSize: 14, color: "#E8D5B7", lineHeight: 1.6 }}>
                Ask your AI assistant to analyze spending trends, detect anomalies, and suggest personalized savings
                strategies.
              </div>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  color: "#A67C52",
                  marginTop: 12,
                  letterSpacing: 1,
                }}
              >
                OPEN ASSISTANT →
              </div>
            </button>
          </div>
        )}

        {/* ── PROFILE ── */}
        {tab === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#2C1A0E", borderRadius: 20, padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: "#A67C52",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 26,
                    color: "#FAF7F2",
                    flexShrink: 0,
                  }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#FAF7F2" }}>
                    {displayName}
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#6B5B4E", marginTop: 2 }}>
                    {userProfile?.email ?? ""}
                  </div>
                  <div
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 9,
                      color: "#A67C52",
                      letterSpacing: 1,
                      marginTop: 4,
                    }}
                  >
                    PREMIUM MEMBER
                  </div>
                </div>
                <button
                  onClick={() => setShowProfileEdit(true)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 10,
                    border: "2px solid #E8D5B7",
                    background: "transparent",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    color: "#E8D5B7",
                    cursor: "pointer",
                    letterSpacing: 1,
                  }}
                >
                  EDIT
                </button>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                {[
                  { label: "Transactions", val: transactions.length },
                  { label: "Categories", val: categories.length },
                  { label: "Savings %", val: `${savingsPct}%` },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: 10,
                      padding: "10px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#E8D5B7" }}>
                      {s.val}
                    </div>
                    <div
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 9,
                        color: "#6B5B4E",
                        marginTop: 2,
                        letterSpacing: 0.5,
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 16, padding: "20px", border: "1px solid #F0EAE0" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: "#2C1A0E", marginBottom: 4 }}>
                Bank Accounts
              </div>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  color: "#9B8878",
                  letterSpacing: 1,
                  marginBottom: 16,
                }}
              >
                POWERED BY PLAID · END-TO-END ENCRYPTED
              </div>
              {connectedBanks.length === 0 ? (
                <div
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: 13,
                    color: "#9B8878",
                    marginBottom: 16,
                    lineHeight: 1.6,
                  }}
                >
                  No bank connected yet. Link your account to import transaction data automatically.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  {connectedBanks.map((b) => (
                    <div
                      key={b}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 14px",
                        borderRadius: 10,
                        background: "#F0F5EE",
                        border: "1px solid #D0DFD0",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 18 }}>🏦</span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#2C1A0E" }}>{b}</span>
                      </div>
                      <span
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 9,
                          color: "#6B9B6B",
                          letterSpacing: 1,
                        }}
                      >
                        CONNECTED ✓
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowBankModal(true)}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: 12,
                  border: "2px solid #E8D5B7",
                  background: "#FAF7F2",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  color: "#5C3D2E",
                  letterSpacing: 2,
                  cursor: "pointer",
                  textTransform: "uppercase",
                }}
              >
                + Connect Bank Account
              </button>
            </div>

            <div style={{ background: "#fff", borderRadius: 16, padding: "20px", border: "1px solid #F0EAE0" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: "#2C1A0E", marginBottom: 16 }}>
                Settings
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {[
                  {
                    label: "Face ID / Biometric Login",
                    desc: "Log in with your device biometrics",
                    val: biometricEnabled,
                    set: setBiometricEnabled,
                  },
                  {
                    label: "AI Assistant Insights",
                    desc: "Receive personalized spending alerts",
                    val: aiNotifications,
                    set: setAiNotifications,
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "14px 0",
                      }}
                    >
                      <div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#2C1A0E" }}>
                          {item.label}
                        </div>
                        <div
                          style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9B8878", marginTop: 2 }}
                        >
                          {item.desc}
                        </div>
                      </div>
                      <Toggle value={item.val} onChange={item.set} />
                    </div>
                    <div style={{ height: 1, background: "#F0EAE0" }} />
                  </div>
                ))}
              </div>
              {[
                { icon: "🔒", label: "End-to-end encryption", desc: "All data encrypted in transit & at rest" },
                { icon: "🔑", label: "Secure token auth", desc: "No bank credentials stored on device" },
                { icon: "🛡️", label: "Input sanitization", desc: "All inputs validated & sanitized" },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: "1px solid #F0EAE0",
                  }}
                >
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#2C1A0E" }}>
                      {item.label}
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9B8878" }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: "#fff", borderRadius: 16, padding: "20px", border: "1px solid #F0EAE0" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: "#2C1A0E", marginBottom: 4 }}>
                Financial Profile
              </div>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  color: "#9B8878",
                  letterSpacing: 1,
                  marginBottom: 16,
                }}
              >
                YOUR FINANCIAL SUMMARY
              </div>
              {[
                { label: "Monthly Income", val: `$${(financialData.monthlyIncome ?? 0).toLocaleString()}` },
                { label: "Monthly Budget", val: `$${(financialData.monthBudget ?? 0).toLocaleString()}` },
                { label: "Savings Goal", val: `$${(financialData.savingsGoal ?? 0).toLocaleString()}` },
                { label: "Saved So Far", val: `$${(financialData.savedSoFar ?? 0).toLocaleString()}` },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: "1px solid #F0EAE0",
                  }}
                >
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#6B5B4E" }}>
                    {item.label}
                  </span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#2C1A0E" }}>
                    {item.val}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowCatsModal(true)}
              style={{
                background: "#FBF3EA",
                borderRadius: 16,
                padding: "18px 20px",
                border: "1px solid #E8D5B7",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    color: "#A67C52",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Custom Categories
                </div>
                <div style={{ fontFamily: "'Georgia', serif", fontSize: 13, color: "#5C3D2E" }}>
                  Manage, add, or delete spending categories
                </div>
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#A67C52" }}>→</div>
            </button>

            <div
              style={{
                background: "#FBF3EA",
                borderRadius: 16,
                padding: "18px 20px",
                border: "1px solid #E8D5B7",
              }}
            >
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  color: "#A67C52",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Your Data, Your Control
              </div>
              <div style={{ fontFamily: "'Georgia', serif", fontSize: 13, color: "#5C3D2E", lineHeight: 1.7 }}>
                Correct any transaction, update financial details, or delete your account at any time. All corrections
                improve your AI insights.
              </div>
            </div>

            <button
              onClick={onLogout}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: 12,
                border: "2px solid #F0EAE0",
                background: "transparent",
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: "#9B8878",
                letterSpacing: 2,
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => setShowAI(true)}
        style={{
          position: "fixed",
          bottom: 88,
          right: 24,
          width: 52,
          height: 52,
          borderRadius: "50%",
          border: "none",
          background: "linear-gradient(135deg, #2C1A0E, #5C3D2E)",
          color: "#E8D5B7",
          fontSize: 20,
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(44,26,14,0.4)",
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ✦
      </button>
    </div>
  );
}
