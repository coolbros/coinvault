# CoinVault — AI-Powered Numismatic Collection Management Platform
## Architecture, System Design & Implementation Tracker

### Overview
**CoinVault** is a production-grade, local-first numismatic collection management and AI vision attribution platform built with React Native, Expo SDK 58, TypeScript, Expo Router, and SQLite.

### Core Architectural Principle
The system is built around the fundamental numismatic domain boundary:
- **`CoinType`**: The abstract numismatic classification (country, denomination, series, minting years, ruler, standard specifications, official catalog references).
- **`Specimen`**: An individual physical coin owned by a collector (physical photographs, user-assessed grade, AI-condition assessment, purchase price, provenance, auction references, valuation history, custom tags).
- **Referential Invariant**: Deleting a physical specimen cascades to its images, valuation history, and condition assessments, but **strictly preserves** the associated `CoinType` in the numismatic catalog.

---

### Project Structure & Components

```
coinvault/
├── app/                           # Expo Router application routes
│   ├── _layout.tsx                # Root layout, SQLite database initialization & dark theme
│   ├── (tabs)/                    # 5-destination bottom navigation bar
│   │   ├── _layout.tsx            # Custom luxury tab bar with prominent scan medallion button
│   │   ├── index.tsx              # Home collection dashboard (real SQLite metrics, zero hardcoded stats)
│   │   ├── collection.tsx         # Inventory management (Grid/List, Filters, Sort, Multi-select bulk actions)
│   │   ├── scan.tsx               # AI Coin Scanner (Dual obverse/reverse capture, Quality indicator)
│   │   ├── discover.tsx           # World Numismatic Reference Database (Ancient, Medieval, Colonial, Modern)
│   │   └── profile.tsx            # Settings, Preferences, Import/Export, AI Provider & API Key Config
│   ├── specimen/
│   │   ├── [id].tsx               # Specimen details (interactive photo flip, grade, valuation, comparables)
│   │   ├── new.tsx                # Manual specimen creation with camera & photo picker
│   │   └── edit/[id].tsx          # Edit specimen details, user grade, purchase price, provenance
│   ├── coin-type/
│   │   └── [id].tsx               # CoinType reference details with "Add Specimen" flow
│   ├── scan/
│   │   └── confirm.tsx            # Identification review, editing & confirmation screen
│   └── analytics.tsx              # Deep-dive collection analytics (geography, eras, metals, finances)
├── src/
│   ├── constants/
│   │   └── theme.ts               # Luxury numismatic palette (#101214, Antique Gold #C5A15A)
│   ├── db/
│   │   ├── schema.ts              # SQLite table schemas, indexes & foreign key rules
│   │   ├── client.ts              # SQLite database connection & migrations runner
│   │   ├── seedData.ts            # Curated world numismatic reference database (Athenian Owl, Morgan, etc.)
│   │   └── repositories/
│   │       ├── coinTypeRepository.ts
│   │       ├── specimenRepository.ts
│   │       ├── identificationRepository.ts
│   │       ├── valuationRepository.ts
│   │       ├── conditionRepository.ts
│   │       └── tagRepository.ts
│   ├── services/
│   │   ├── ai/
│   │   │   ├── types.ts           # Zod schema & TypeScript interfaces for AI responses
│   │   │   ├── providerInterface.ts # CoinIdentificationProvider & QualityProvider
│   │   │   ├── mockProvider.ts    # Realistic numismatic engine with confidence scoring
│   │   │   ├── geminiProvider.ts  # Google Gemini Multimodal Vision API integration
│   │   │   ├── imageQuality.ts    # Blur assessment, contrast & framing validation
│   │   │   └── gradingProvider.ts # Sheldon 1-70 & condition assessment engine
│   │   ├── valuation/
│   │   │   └── valuationEngine.ts # Extensible valuation engine (metal vs numismatic)
│   │   ├── storage/
│   │   │   └── imageStorage.ts    # Persistent device filesystem storage (expo-file-system)
│   │   └── export/
│   │       ├── jsonBackup.ts      # Full relational JSON export & validated restore
│   │       └── csvExport.ts       # Tabular collection export
│   ├── stores/
│   │   ├── collectionStore.ts     # Zustand store for specimens, filter/search state
│   │   ├── scanStore.ts           # State machine for scan capture & identification
│   │   └── settingsStore.ts       # User currency, units, theme, AI provider preference
│   ├── components/                # Reusable luxury UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── CoinAvatar.tsx
│   │   ├── StatCard.tsx
│   │   ├── Badge.tsx
│   │   ├── SearchBar.tsx
│   │   └── QualityIndicator.tsx
│   └── __tests__/                 # Automated test suite (Jest + better-sqlite3 in-memory engine)
│       ├── repositories.test.ts   # CRUD, cascades, relations, and real metrics tests
│       ├── aiValidation.test.ts   # Zod schema, confidence & parsing tests
│       ├── valuationEngine.test.ts# Numismatic valuation & bullion math tests
│       └── backupRestore.test.ts  # JSON roundtrip validation tests
```

---

### Implementation Phases & Status

- [x] **PHASE 1 — Functional Foundation**:
  - SQLite schema, migrations, foreign keys enabled.
  - Repositories: `CoinType`, `Specimen`, `Tags`, `Valuation`, `Condition`, `Identification`.
  - Cascade integrity: deleting a physical specimen preserves the abstract CoinType in the catalog.
  - Persistent local filesystem image management (`expo-file-system`).
  - Luxury numismatic design system (#101214 background, #C5A15A antique gold accents).
  - 5-destination bottom navigation bar with prominent central scan medallion.
  - Home dashboard with real SQLite metrics (coins owned, unique types, portfolio value, countries).
  - Central inventory screen with Grid and List views, multi-select bulk operations, search, filters, and sorting.
  - Full specimen CRUD: manual creation, rich detail view with interactive obverse/reverse photo flip, edit, duplicate, and delete.

- [x] **PHASE 2 — AI Scanning Workflow**:
  - Dual-side photography interface (Obverse & Reverse).
  - Camera capture and gallery import.
  - Image quality checks (focus/blur score, lighting, framing, coin boundary guidance).
  - Modular AI Provider abstraction (`CoinIdentificationProvider`).
  - Google Gemini 2.5 Flash Multimodal Vision API integration with base64 image encoding.
  - High-fidelity offline Mock Numismatic Engine.
  - Zod-validated structured output with confidence scores and alternative candidates.
  - Identification confirmation screen: editable attributes, alternative candidate selection, and verification before adding to collection.

- [x] **PHASE 3 — Numismatic Intelligence**:
  - Coin Condition Assessment subsystem (Sheldon 1–70, wear, luster, strike, surface preservation).
  - Prominent disclaimer that AI condition estimates do not replace accredited third-party slab certification.
  - Extensible Valuation Engine distinguishing intrinsic bullion melt value from numismatic market premium.
  - Verified auction sales comparables and valuation history tracking.

- [x] **PHASE 4 — Collection Intelligence & Discovery**:
  - Discover section with pre-populated curated historical world coins catalog (Ancient Greece Athenian Owl, Augustus Denarius, Byzantine Solidus, Mughal Akbar Mohur, Queen Victoria Sovereign, British India 1947 Rupee, Morgan Dollar, French Rooster, etc.).
  - Deep-dive collection analytics screen: financial gain/loss, geographic distribution bars, metallurgic composition, and historical epochs.
  - "Add physical specimen of this coin type" action directly from reference detail page.

- [x] **PHASE 5 — Production Polish & Rigorous Verification**:
  - Full relational JSON backup export and validated restore (with merge or overwrite options).
  - CSV collection inventory export for spreadsheet analysis.
  - Multi-currency support (USD, EUR, GBP, INR, JPY, CAD, AUD, CHF) and unit systems.
  - 100% strict TypeScript compliance with zero compile errors (`tsc --noEmit`).
  - Automated Jest test suite (13/13 passing tests) validating repositories, schema enforcement, valuation math, and backup roundtrip.

---

### Verification & Testing Results

```bash
$ jest
PASS src/__tests__/valuationEngine.test.ts
PASS src/__tests__/repositories.test.ts
PASS src/__tests__/backupRestore.test.ts
PASS src/__tests__/aiValidation.test.ts

Test Suites: 4 passed, 4 total
Tests:       13 passed, 13 total
Snapshots:   0 total
Time:        5.643 s
```

```bash
$ tsc --noEmit
# 0 errors, completely type-safe
```

---

### Setup & Running Instructions

1. **Install Dependencies**:
   ```bash
   cd coinvault
   pnpm install
   ```

2. **Run the Automated Test Suite**:
   ```bash
   pnpm test
   ```

3. **Start the Expo Development Server**:
   ```bash
   pnpm start
   # or
   pnpm android
   # or
   pnpm ios
   # or
   pnpm web
   ```
