# CoinVault — AI-Powered Numismatic Collection Management Platform
## Development Architecture, System Design & Implementation Tracker

### Overview
CoinVault is a local-first, production-grade numismatic inventory and identification system built with React Native, Expo, TypeScript, Expo Router, and SQLite.

The fundamental domain design separates:
- **`CoinType`**: The abstract numismatic classification (country, denomination, series, minting years, ruler, standard specifications, catalog references).
- **`Specimen`**: An individual physical coin owned by a collector (provenance, user-assessed grade, AI-condition assessment, physical photos, purchase history, valuations, custom tags).

---

### Project Structure
```
coinvault/
├── app/                           # Expo Router application routes
│   ├── _layout.tsx                # Root layout with providers & theme
│   ├── (tabs)/                    # 5-tab primary navigation
│   │   ├── _layout.tsx            # Custom luxury numismatic bottom tab bar
│   │   ├── index.tsx              # Home collection dashboard (real SQLite metrics)
│   │   ├── collection.tsx         # Inventory management (Grid/List, Filters, Multi-select)
│   │   ├── scan.tsx               # AI Coin Scanner (Obverse/Reverse, Quality Analysis)
│   │   ├── discover.tsx           # World Numismatic Reference Database
│   │   └── profile.tsx            # Settings, Preferences, Import/Export, API Config
│   ├── specimen/
│   │   ├── [id].tsx               # Rich specimen detail screen (photos, history, valuations)
│   │   ├── new.tsx                # Manual specimen creation
│   │   └── edit/[id].tsx          # Edit specimen details
│   ├── coin-type/
│   │   └── [id].tsx               # CoinType reference details with "Add Specimen" flow
│   ├── scan/
│   │   └── confirm.tsx            # Identification review, editing & confirmation screen
│   └── analytics.tsx              # Deep-dive collection analytics (geography, eras, metals, finances)
├── src/
│   ├── constants/
│   │   └── theme.ts               # Luxury numismatic palette & typography
│   ├── db/
│   │   ├── schema.ts              # SQLite table schemas, indexes & foreign key rules
│   │   ├── client.ts              # SQLite database connection & migrations runner
│   │   ├── repositories/
│   │   │   ├── coinTypeRepository.ts
│   │   │   ├── specimenRepository.ts
│   │   │   ├── identificationRepository.ts
│   │   │   ├── valuationRepository.ts
│   │   │   ├── conditionRepository.ts
│   │   │   └── tagRepository.ts
│   │   └── seedData.ts            # Curated world numismatic reference database
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
│   │   ├── FilterModal.tsx
│   │   ├── SearchBar.tsx
│   │   └── QualityIndicator.tsx
│   └── __tests__/                 # Automated test suite
│       ├── repositories.test.ts   # CRUD, cascades, relations tests
│       ├── aiValidation.test.ts   # Zod schema, confidence & parsing tests
│       ├── valuationEngine.test.ts# Numismatic valuation math tests
│       └── backupRestore.test.ts  # JSON roundtrip validation tests
```

---

### Implementation Phases

- [x] **Project Initialization**: Expo SDK 58, TypeScript, Expo Router, dependencies installed, git initialized.
- [ ] **Phase 1: Functional Foundation**:
  - SQLite schema, repositories (CoinType, Specimen, Tags, Images).
  - Persistent local filesystem image management.
  - Luxury theme design system.
  - Bottom navigation (5 tabs).
  - Home dashboard with real SQLite metrics.
  - Collection screen (Grid/List, search, filter, sort, multi-selection).
  - Specimen detail view, manual creation, edit, and deletion (preserving CoinType).
- [ ] **Phase 2: AI Scanning Workflow**:
  - Camera & gallery image pickers for Obverse and Reverse.
  - Image quality validation (blur estimation, illumination, resolution).
  - AI Provider abstraction layer (`CoinIdentificationProvider`).
  - Realistic Mock Numismatic Engine + Gemini Multimodal Vision API provider.
  - Zod-validated structured output with confidence scores & alternative candidates.
  - Identification Confirmation Screen with field editing and verification.
- [ ] **Phase 3: Numismatic Intelligence**:
  - Coin Condition Assessment (Sheldon 1-70, wear, luster, surface observations, certification disclaimer).
  - Coin Valuation Engine (intrinsic metal vs numismatic market estimates, condition pricing curve).
  - Historical valuation tracking.
- [ ] **Phase 4: Collection Intelligence & Discovery**:
  - Discover section with rich pre-populated historical coin reference catalog.
  - Deep-dive analytics dashboard (geographic, historical eras, metal composition, financial return).
  - Direct creation of specimens from reference catalog coin types.
- [ ] **Phase 5: Production Polish & Rigorous Testing**:
  - Comprehensive Jest test suite.
  - Full JSON backup and validated restore.
  - CSV collection export.
  - Settings (currency, units, theme, API key management).
  - Git commits at each major milestone.
