# DronaPay Statement Scanner — Bank Statement Fraud & Risk Engine

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-success?style=for-the-badge&logo=vercel)](https://drona-pay-statement-scanner-tau.vercel.app/)

🌐 **Live Demo:** [https://drona-pay-statement-scanner-tau.vercel.app/](https://drona-pay-statement-scanner-tau.vercel.app/)

A high-performance, real-world Bank Statement & UPI Transaction Fraud Detection platform built specifically for Indian BFSI switches and core banking gateways.

Inspired by **Drona Pay's Acharya** core transaction monitoring system.

---

## 🎯 What This App Does

1. **📂 Real Bank Statement & CSV Fraud Scanner (Drag-and-Drop)**
   - Upload any real bank spreadsheet / UPI CSV statement (or click **"Load 250 Sample Transactions"** to test immediately).
   - Scans hundreds of transactions in milliseconds.
   - Computes total statement volume and **Total Money at Risk (₹)** across all flagged items.
   - Provides a searchable, filterable, and sortable statement ledger with clear status badges: 🟢 **SAFE**, 🟡 **REVIEW**, 🔴 **FRAUD**.

2. **🔍 Plain-English Evidence Inspector**
   - Click on any transaction row to open a slide-over investigation file.
   - Explains in **everyday, plain English** exactly why the payment was flagged.
   - Shows a **Risk Score (0–100)** with a breakdown of 5 core BFSI heuristics:
     1. **Rapid Velocity Bursts:** High-frequency rapid succession debits (< 60s).
     2. **Impossible Travel (Geo-Drift):** Haversine distance & velocity calculation between successive transactions (e.g., 10,800 km/h flight jump).
     3. **High-Risk Merchant Surcharges:** Online gambling (MCC 7995), crypto mixers, and bullion liquidation.
     4. **Mule Account Syndicates:** Funneling funds into known scam accounts and shell entities.
     5. **Device & Hardware Integrity:** Rooted handsets, Genymotion emulators, and Tor exit relays.

---

## 🛠️ Tech Stack Grounded in Drona Pay's JD

- **Frontend:** React 19, TypeScript, TailwindCSS, Lucide Icons
- **Architecture:** Sub-50ms Inline Switch, Haversine Great-Circle Geocoding, Sliding-Window Rate Limiting
- **Design Standard:** Master Glassmorphism (`#07080a` canvas, frosted glass cards, Plus Jakarta Sans, JetBrains Mono)
- **Port:** `5173`

---

## 🚀 Getting Started

This project is 100% self-contained. You can run it on any machine with zero external setup:

```bash
# 1. Navigate to the project directory
cd drona-pay/drona-pay-statement-scanner

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.
