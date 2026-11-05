# CoinVault

A local-first mobile app for coin collectors to catalog physical specimens, run AI-assisted visual attribution, track condition grades, and monitor estimated valuations.

Built with React Native, Expo, TypeScript, and SQLite.

---

## Why CoinVault?

Most coin apps treat a coin as a flat database entry. In numismatics, there is a fundamental difference between:

- **Coin Type**: The abstract definition (e.g., *1947 British India 1 Rupee*, nickel, George VI, Bombay mint).
- **Physical Specimen**: An individual coin you physically own (e.g., your specific piece in AU55, bought for \$45 at auction, with its own patina, scratch marks, and storage location).

CoinVault models this distinction in its relational schema. If you delete a physical specimen from your collection, the underlying coin classification remains in your reference catalog.

---

## Key Features

### 1. Dual-Side Scanner & Vision Attribution
- Capture or import both obverse (heads) and reverse (tails) photos.
- Pre-flight quality checks warn you if an image is blurry or poorly illuminated before sending it for inference.
- Structured attribution extracts country, denomination, year, ruler, mint mark, metal, and catalog numbers (e.g., KM#, RIC).
- Single-side scans work, but the app highlights attributes that carry lower confidence without the reverse legend.
- Editable confirmation screen: nothing enters your collection without review and manual adjustments.

### 2. Multi-Provider AI Architecture
- **Offline / Sandbox Engine**: Deterministic local engine with confidence scoring and alternative candidate suggestions. Useful for development or offline usage.
- **Google Gemini 2.5 Flash**: Multimodal vision attribution via the Gemini API. Your API key is stored locally on-device and never proxied through external servers.

### 3. Condition Assessment & Valuation Subsystems
- **Condition Grading**: Supports the Sheldon 1–70 scale with category-level observations (wear patterns, field luster, strike quality, hairlines, cleaning indicators).
- **Valuation Engine**: Separates intrinsic metal bullion value (melt price based on weight and metal composition) from collector numismatic market value.
- **Clear Disclaimers**: Machine grading is presented as an automated estimate, distinct from certified third-party encapsulation (PCGS, NGC, ANACS).

### 4. Collection Management & Discovery
- **Inventory Views**: Toggle between Grid and List views with multi-select bulk operations.
- **Search & Filter**: Search by ruler, country, metal, denomination, catalog reference, or custom tags.
- **Real-Time Analytics**: Dashboard calculations (portfolio value, total cost, unrealized gain/loss, geographic spread, metal breakdown) are derived directly from SQLite queries, not hardcoded statistics.
- **Reference Catalog**: Pre-seeded with historical types ranging from Athenian Owls and Roman Denarii to Victorian Sovereigns and Morgan Dollars. Add specimens directly from catalog entries.

### 5. Data Ownership & Portability
- **Local-First**: All data, images, and valuations live on your device in SQLite. No account registration or cloud sign-in required.
- **JSON Backup / Restore**: Export full relational backups and restore them with schema validation (choice of merging or overwriting).
- **CSV Export**: Export collection spreadsheets compatible with Excel or Google Sheets.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React Native, Expo (SDK 58) |
| **Language** | TypeScript (strict mode) |
| **Routing** | Expo Router (file-based navigation) |
| **Database** | SQLite via `expo-sqlite` (foreign keys enabled) |
| **State** | Zustand |
| **Validation** | Zod |
| **Camera & Media** | `expo-camera`, `expo-image-picker`, `expo-file-system` |
| **Testing** | Jest, `better-sqlite3` (in-memory SQLite test adapter) |

---

## Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- `pnpm` (or `npm`)
- Expo Go app on your phone, or an Android/iOS emulator

### Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:coolbros/coinvault.git
   cd coinvault
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run the automated test suite:
   ```bash
   pnpm test
   ```

4. Start the development server:
   ```bash
   pnpm start
   ```

Scan the QR code with Expo Go (Android) or the Camera app (iOS) to launch the app.

---

## Database Schema Overview

```
coin_types (Abstract Classification)
├── id (PK)
├── country, denomination, year_start, year_end
├── ruler, mint, metal, coin_series, historical_period
├── catalog_references (JSON array)
└── diameter_mm, weight_g, shape, edge_type

specimens (Physical Coins Owned)
├── id (PK)
├── coin_type_id (FK -> coin_types.id, ON DELETE RESTRICT)
├── custom_name, user_grade, grading_service, cert_number
├── acquisition_date, acquisition_price, acquisition_source
└── obverse_image_path, reverse_image_path

Related tables (ON DELETE CASCADE from specimen):
├── coin_images
├── condition_assessments (Sheldon 1-70, observations, confidence)
├── valuation_records (estimated range, melt value, auction comparables)
└── specimen_tags (many-to-many with tags)
```

---

## Testing

The project includes unit and integration tests covering the repository layer, cascade behavior, valuation math, and backup/restore roundtrips.

```bash
# Run all tests
pnpm test

# Check TypeScript types
pnpm exec tsc --noEmit
```

Tests run against an in-memory SQLite database (`better-sqlite3`), verifying real relational constraints without mocking the database driver.

---

## Architecture & Technical Documentation

For in-depth architectural and implementation documentation:

- [ARCHITECTURE.md](ARCHITECTURE.md) — Architectural layers, unified specimen ingestion service, synchronous SQLite profiling, collection virtualization, and security models.
- [DATA_MODEL.md](DATA_MODEL.md) — Relational database schema, `CoinType` vs `Specimen` design, foreign keys, cascade rules, and composite indexes.
- [AI_PIPELINE.md](AI_PIPELINE.md) — Dual-tier image processing, multi-dimensional quality heuristics, Google Gemini multimodal vision integration, error classification, and valuation models.

---

## License

MIT
