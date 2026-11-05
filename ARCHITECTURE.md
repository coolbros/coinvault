# CoinVault Architecture & System Design

CoinVault is a high-performance, local-first numismatic collection management and AI-powered coin attribution mobile platform built on React Native, Expo SDK 58, TypeScript, and SQLite.

---

## 1. High-Level Architectural Layers

CoinVault is organized into five decoupled, testable layers:

```mermaid
graph TD
    UI["Presentation Layer (Expo Router / React Native)"]
    Store["State Management Layer (Zustand Stores)"]
    Service["Domain / Use Case Layer (Ingestion, Valuation, Grading, Security)"]
    Repo["Repository Layer (Typed SQLite Data Access)"]
    Storage["Persistence Layer (Expo SQLite + FileSystem + SecureStore)"]

    UI --> Store
    UI --> Service
    Store --> Service
    Store --> Repo
    Service --> Repo
    Service --> Storage
    Repo --> Storage
```

### Layer Responsibilities

1. **Presentation Layer (`app/` & `src/components/`)**:
   - Navigation via file-based Expo Router (`app/(tabs)`, `app/specimen/`).
   - Pure UI rendering with strict component separation.
   - Memoized virtualization via `GridCoinCard` and `ListCoinCard` with `React.memo`.
   - Global crash resilience with root-level `ErrorBoundary`.

2. **State Management Layer (`src/stores/`)**:
   - `collectionStore`: Collection inventory, filtering, multi-select batch actions, live statistics.
   - `scanStore`: Multi-step scan state machine (`idle` → `capturing` → `analyzing` → `ready_to_confirm`).
   - `settingsStore`: Currency, grading scale preference, active AI provider, secure API key coordination, configurable bullion spot prices.

3. **Domain / Service Layer (`src/services/`)**:
   - `SpecimenIngestionService`: Single authoritative orchestrator for coin creation, image storage, CoinType deduplication, grading, and valuation.
   - `imageProcessor`: Generates compressed 1024px AI inference images and 300px thumbnails while preserving full-resolution originals.
   - `imageQualityService`: Multi-dimensional framing, resolution, and blur heuristic analysis.
   - `GeminiCoinIdentificationProvider`: Google Gemini 2.5 Flash multimodal vision client with resilient error classification and timeout guards.
   - `valuationEngine`: Algorithmic bullion melt + numismatic premium valuation model.
   - `secureStorage`: Encrypted keychain/keystore abstraction using `expo-secure-store`.

4. **Repository Layer (`src/db/repositories/`)**:
   - Enforces relational normalization and provides type-safe CRUD operations.
   - Isolates all SQL statements from UI components.

5. **Data Persistence Layer (`src/db/` & `src/services/storage/`)**:
   - SQLite relational database with `PRAGMA foreign_keys = ON`.
   - Versioned database schema migrations tracked via SQLite's native `PRAGMA user_version`.
   - Persistent non-volatile device storage for coin photos.

---

## 2. Unified Specimen Ingestion Pipeline

Prior to architectural hardening, specimen persistence logic was duplicated across `scanStore.ts` and `app/specimen/new.tsx`. Both flows now delegate exclusively to `SpecimenIngestionService`:

```mermaid
sequenceDiagram
    participant User as Collector
    participant Ingestion as SpecimenIngestionService
    participant ImageProc as imageProcessor
    participant Storage as imageStorage / FileSystem
    participant CoinTypeRepo as coinTypeRepository
    participant SpecimenRepo as specimenRepository
    participant Grading as coinGradingService
    participant Valuation as valuationEngine

    User->>Ingestion: ingest(options)
    Ingestion->>ImageProc: processAndPersist(obverse, reverse)
    ImageProc->>Storage: Persist Original, Inference, Thumbnail
    Ingestion->>CoinTypeRepo: findOrCreate(country, denomination, year, etc.)
    CoinTypeRepo-->>Ingestion: CoinType entity
    Ingestion->>SpecimenRepo: create(specimenData)
    SpecimenRepo-->>Ingestion: Specimen entity
    Ingestion->>Storage: Insert multi-tier paths into coin_images table
    alt AI Identification Provided
        Ingestion->>Storage: Insert identification_record
    end
    alt Grading Enabled
        Ingestion->>Grading: assess(images, coinType, metal)
        Ingestion->>Storage: Insert condition_assessment
    end
    alt Valuation Enabled
        Ingestion->>Valuation: estimate(coinType, grade, metal, weight)
        Ingestion->>Storage: Insert valuation_record
    end
    Ingestion-->>User: Fully Hydrated Specimen
```

---

## 3. SQLite Architecture & Versioned Migrations

Database evolution is managed via a dedicated migration runner utilizing SQLite's native `PRAGMA user_version`:

1. **Migration Runner (`src/db/migrations/runner.ts`)**:
   - Reads `PRAGMA user_version`.
   - Executes pending migrations sequentially inside a transaction.
   - Updates `PRAGMA user_version = X` on success.
   - Idempotent and backward-compatible with pre-migration databases.

2. **Migration History**:
   - **v1 (`initial_schema`)**: Base relational tables and initial foreign keys.
   - **v2 (`composite_query_indexes`)**: Composite indexes for query acceleration:
     - `idx_valuation_specimen_date_desc ON valuation_records(specimen_id, valuation_date DESC)`
     - `idx_condition_specimen_created_desc ON condition_assessments(specimen_id, created_at DESC)`
     - `idx_coin_types_country_denom_year ON coin_types(country, denomination, year_start)`
     - `idx_coin_images_specimen_side ON coin_images(specimen_id, image_side)`

---

## 4. Performance & Execution Profiling

### Synchronous JSI vs. Asynchronous SQLite Evaluation
- CoinVault runs Expo SQLite in **synchronous mode** (`openDatabaseSync`, `getAllSync`, `runSync`).
- **Empirical Measurement**: On an in-memory / device database with 100 fully hydrated specimens and 300 valuation records, `specimenRepository.list()` completes in **12 ms** (~0.12 ms per specimen).
- Aggregate statistics calculation completes in **1 ms**.
- **Conclusion**: Synchronous JSI bindings avoid promise microtask queues, bridge hops, and race conditions during UI mounting. Asynchronous operations are reserved for I/O operations that can block (e.g. image manipulation, network AI vision calls, secure keychain access).

### Collection Virtualization
- Extracted `GridCoinCard` and `ListCoinCard` into `React.memo` components.
- Configured FlatList virtualization parameters:
  - `initialNumToRender: 8`
  - `maxToRenderPerBatch: 10`
  - `windowSize: 7`
  - `removeClippedSubviews: true`
- Avoids re-rendering off-screen cards and prevents frame drops during rapid scrolling.

---

## 5. Security & Privacy Architecture

- **API Key Storage**: Gemini API keys are never stored in plaintext SQLite or AsyncStorage. They are encrypted using `expo-secure-store` via `secureStorage.ts` (using Android Keystore and iOS Keychain).
- **Graceful Fallbacks**: In headless environments or web development where native keystore is unavailable, an in-memory fallback maintains operability without crashing.
- **Root Error Boundary**: Catches unexpected rendering failures, prevents app termination, and provides a one-click recovery interface.
