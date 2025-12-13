# Draw Type Enhancement - Implementation Summary

## Overview
Enhanced the scraping and prediction system to support separate tables for each Ghana Lotto 5/90 draw type. This allows for more accurate predictions by analyzing each draw type independently.

## What Was Implemented

### 1. Database Schema Enhancement
- **Migration**: `003_create_lotto_type_tables.sql`
  - Creates separate tables for each lotto type (e.g., `draws_monday_special`, `draws_midweek`)
  - Automatically syncs new draws from main `draws` table to type-specific tables via trigger
  - Functions to create and populate type-specific tables

### 2. Backend Utilities
- **`lottoTypeUtils.ts`**: Utility functions for:
  - Normalizing lotto type names to valid table names
  - Getting table names for specific lotto types
  - Checking if a table is a lotto type-specific table
  - Getting all available lotto types from database

### 3. Backend Services Updates
- **`drawService.ts`**:
  - Added `useTypeSpecificTable` parameter to `getDraws()` method
  - Automatically queries type-specific table when available
  - Added `getAvailableLottoTypes()` method
  - Falls back to main table if type-specific table doesn't exist

- **`scraperService.ts`**:
  - No changes needed - trigger automatically syncs to type-specific tables

### 4. API Endpoints
- **`GET /api/draws/types`**: Get all available lotto types
- **`GET /api/predictions/lotto-types`**: Get lotto types (alias for convenience)
- **`POST /api/predictions/generate`**: Updated to support:
  - `lottoType` query parameter
  - `useTypeSpecificTable` query parameter (default: false)
- **`POST /api/predictions/analyze`**: Updated to support same parameters

### 5. Frontend Updates
- **`Predictions.tsx`**:
  - Added lotto type dropdown selector
  - Added checkbox to use type-specific table (recommended)
  - Loads available lotto types on page load
  - Defaults to first available type
  - Option to use "All Types" for mixed predictions

- **`client.ts`**:
  - Added `getLottoTypes()` to `drawsApi`
  - Added `getLottoTypes()` to `predictionsApi`
  - Updated `generate()` and `analyze()` to support `useTypeSpecificTable` parameter

## How It Works

### Database Structure
```
draws (main table - all types mixed)
├── draws_monday_special (type-specific)
├── draws_midweek (type-specific)
├── draws_fortune_thursday (type-specific)
└── ... (other types)
```

### Automatic Synchronization
When a new draw is inserted into the main `draws` table:
1. Trigger `trigger_sync_to_lotto_type_table` fires
2. Creates type-specific table if it doesn't exist
3. Inserts draw into the appropriate type-specific table
4. No manual intervention needed

### Prediction Flow
1. User selects a lotto type (or "All Types" for mixed)
2. If type-specific table is enabled and type is selected:
   - Queries the type-specific table (e.g., `draws_monday_special`)
   - More accurate predictions based on that type's history only
3. If "All Types" or type-specific table disabled:
   - Queries main `draws` table with lotto type filter
   - Mixed predictions across all types

## Usage

### Running the Migration
```bash
# Connect to your database and run:
psql -U your_user -d your_database -f backend/src/database/migrations/003_create_lotto_type_tables.sql
```

Or use your database management tool to execute the SQL file.

### For Developers

#### Backend: Query Type-Specific Draws
```typescript
// Use type-specific table
const draws = await drawService.getDraws({
  lottoType: 'Monday Special',
  useTypeSpecificTable: true,
});

// Use main table (mixed)
const draws = await drawService.getDraws({
  lottoType: 'Monday Special',
  useTypeSpecificTable: false,
});
```

#### Frontend: Generate Predictions
```typescript
// Type-specific prediction (recommended)
await predictionsApi.generate({
  strategy: 'ensemble',
  lottoType: 'Monday Special',
  useTypeSpecificTable: true,
});

// Mixed prediction
await predictionsApi.generate({
  strategy: 'ensemble',
  // lottoType not specified or useTypeSpecificTable: false
});
```

## Benefits

1. **More Accurate Predictions**: Each draw type has its own patterns and statistics
2. **Better Performance**: Smaller tables for type-specific queries
3. **Flexibility**: Users can choose between type-specific or mixed predictions
4. **Backward Compatible**: Main `draws` table still works for mixed predictions
5. **Automatic**: No manual data migration needed - trigger handles everything

## Notes

- The main `draws` table is kept for backward compatibility and mixed predictions
- Type-specific tables are created automatically when new lotto types are encountered
- Table names are normalized (e.g., "Monday Special" → `draws_monday_special`)
- The system gracefully falls back to the main table if a type-specific table doesn't exist

## Future Enhancements

- Analytics per draw type
- Comparison between draw types
- Type-specific frequency statistics
- Type-specific pattern detection

