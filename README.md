# Clearpath Finance

A React-based personal finance app with transaction tracking, spending insights, savings goals, and an AI assistant. Built for clarity and control over your money.

## Features

- **Transactions** — Add, edit, and delete transactions with categories and notes
- **Persistent data** — All data stored locally (localStorage); no account required to try it
- **Real calculations** — Balance, monthly spend, and weekly charts derived from your transactions
- **Category breakdown** — Donut chart and category list with custom categories (add, edit, delete)
- **Savings** — Goal tracking and savings plan options
- **Insights & alerts** — Spending patterns and contextual tips
- **AI assistant** — Optional Anthropic-powered chat for spending analysis and advice (streaming, prompt-safe)
- **Profile & settings** — Editable profile, biometric/notification toggles, bank connection placeholder

## Tech stack

- **React 18** + **Vite 5**
- Local state with custom hooks and `localStorage` persistence
- No backend required; runs fully in the browser

## Getting started

### Prerequisites

- Node.js 18+ and npm

### Install and run

```bash
git clone https://github.com/Alexisprogramin/clearpath-finance.git
cd clearpath-finance
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### AI assistant (optional)

The AI advisor uses the Anthropic API. To enable it:

1. Copy the example env file:
   ```bash
   cp .env.example .env
   ```
2. Add your API key to `.env`:
   ```
   VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```
3. Restart the dev server.

Without a key, the app works normally; the AI panel will show instructions to add one.

### Build for production

```bash
npm run build
npm run preview
```

Output is in `dist/`.

## Project structure

```
src/
├── components/       # UI and feature components
│   ├── charts/      # DonutChart, SparkBar
│   ├── modals/      # Transaction, Categories, Bank, ProfileEdit
│   └── ui/          # AnimatedNumber, Toggle, ModalOverlay
├── constants/       # Defaults, categories, design tokens
├── hooks/           # useTransactions, useCategories, useFinance, useUserProfile, useSettings
├── screens/        # Login, Signup, Onboarding
├── utils/          # Sanitizers, date helpers, finance math, storage, AI chat
├── App.jsx
└── main.jsx
```

## Design

Clearpath uses a fixed design system (colors, typography, layout). The UI is intentional and unchanged from the reference; all improvements are in functionality and architecture.

## Security

- Input sanitization (XSS) and safe number parsing
- AI prompt sanitization to reduce injection risk
- Only aggregate financial data is sent to the AI; no raw account details

## License

MIT (or your chosen license).
