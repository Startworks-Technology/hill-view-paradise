# Hill View Paradise — Society Management System

A modern, responsive residential society management application built with **React (Vite)**, **Tailwind CSS**, and **Firebase Authentication + Cloud Firestore** (modular SDK v10+).

---

## 🌟 Key Features

1. **Single Admin Authentication**:
   - Secure login via Firebase Authentication (`signInWithEmailAndPassword`).
   - Protected client routes with `onAuthStateChanged` session persistence.
   - Built-in instant demo credentials helper for easy testing.

2. **Strict Zero-Array Firestore Schema**:
   - Every single field across all Firestore documents contains **strictly scalar values** (`String`, `Number`, `Boolean`, `Timestamp`, `null`).
   - No arrays are stored anywhere in Firestore.
   - Enforced across all write operations via `assertNoArrayFields()`.

3. **Society Information & Resident Management**:
   - Society overview and default monthly maintenance configuration.
   - Resident directory table with search and filtering by Ownership Type (`Owner` / `Tenant`) and Occupancy (`Occupied` / `Vacant`).
   - Add/Edit modal with duplicate flat number validation.
   - View profile drawer and safe delete confirmation modal.

4. **Maintenance Collections Ledger**:
   - Month & Year selector toolbar.
   - Live financial summaries: **Total Expected**, **Total Collected**, **Total Pending**, **Paid Flats**, **Pending Flats**.
   - Resident dropdown that auto-populates `flatNumber`, `residentName`, `residentId`, and maintenance amount.
   - Prevents duplicate maintenance records for the same flat in the same month & year.

5. **Society Expenses Tracking**:
   - Month & Year selector + Category filter (`Electricity`, `Water`, `Cleaning`, `Security`, `Lift Maintenance`, `Repairs`, `Gardening`, `Plumbing`, `Other`).
   - Automated month and year derivation from the chosen `expenseDate`.
   - Total expenditures and major expense category analytics.

6. **Executive Dashboard**:
   - 6 Key Metric Cards: Total Residents/Flats, Current Month Collections, Current Month Expenses, Net Balance, Pending Maintenance, Total Expected.
   - Collection recovery progress bar and recent transaction activity feeds.
   - One-click sample dataset seeding utility.

---

## 🏗️ Project Architecture

```text
src/
├── components/
│   ├── common/              # Button, Input, Select, Modal, ConfirmModal, SummaryCard, etc.
│   ├── layout/              # Sidebar, Navbar, Main Layout
│   ├── residents/           # ResidentFormModal, ResidentTable, ResidentDetailsModal
│   ├── collections/         # CollectionFormModal, CollectionTable, CollectionSummaryCards
│   └── expenses/            # ExpenseFormModal, ExpenseTable, ExpenseSummaryCards
├── context/
│   └── AuthContext.jsx      # Authentication State & Session Manager
├── firebase/
│   ├── config.js            # Firebase SDK Initialization & Local Demo Fallback
│   ├── auth.js              # Auth Wrapper Methods (signIn, signOut, onAuthStateChanged)
│   └── firestore.js         # Cloud Firestore Modular Exports & References
├── hooks/
│   └── useAuth.js           # useAuth Context Hook
├── pages/
│   ├── Login.jsx            # Admin Authentication Page
│   ├── Dashboard.jsx        # Society Analytics & Metric Cards
│   ├── Residents.jsx        # Society Profile & Resident Directory
│   ├── Collections.jsx      # Maintenance Ledger & Dues
│   ├── Expenses.jsx         # Expenditure Tracking
│   └── NotFound.jsx         # 404 Fallback Route
├── routes/
│   └── ProtectedRoute.jsx   # Route Guard for Private Pages
├── services/
│   ├── residentService.js   # Residents CRUD with duplicate flat validation
│   ├── collectionService.js # Maintenance Collections CRUD with monthly filters
│   ├── expenseService.js    # Expenses CRUD with auto-derived month/year
│   └── seedService.js       # Sample Dataset Seeder
├── utils/
│   ├── constants.js         # Categories, options, default society config
│   ├── currencyUtils.js     # Currency formatters (INR ₹)
│   └── dateUtils.js         # Timestamp and date helpers
├── App.jsx                  # Application Routes
├── main.jsx                 # React DOM Root
└── index.css                # Tailwind CSS v4 directives
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables (Optional)
Copy `.env.example` to `.env` and fill in your Firebase project credentials:
```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

*(Note: If `.env` is omitted or contains placeholder values, the app will run in seamless Local Demo Mode, allowing immediate previewing and full CRUD operations without any setup!)*

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

---

## 🔒 Firestore Security Rules

See [`firestore.rules`](firestore.rules):
```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    match /residents/{residentId} { allow read, write: if isAuthenticated(); }
    match /collections/{collectionId} { allow read, write: if isAuthenticated(); }
    match /expenses/{expenseId} { allow read, write: if isAuthenticated(); }
  }
}
```
