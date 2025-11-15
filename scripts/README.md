# Database Migration Scripts

This directory contains utility scripts for database migrations and updates.

## update-sort-orders.ts

Updates existing laundry items and categories with sort order values.

### Purpose

When the `sortOrder` field was added to the database schema, existing items and categories don't have these values. This script:

1. Updates all categories with their proper sort order (Saudi Wear=1, Tops=2, etc.)
2. Updates all existing items with their sort order based on item name
3. Reports any items that don't have a sort order mapping

### Usage

```bash
# Make sure you have the required dependencies
npm install

# Run the script
npx ts-node scripts/update-sort-orders.ts
```

### What It Does

**Categories:**
- Saudi Wear → sortOrder: 1
- Tops → sortOrder: 2
- Bottoms → sortOrder: 3
- Suits / Uniforms → sortOrder: 4
- Under Wear → sortOrder: 5
- Bed & Bath → sortOrder: 6

**Items:**
Updates items based on their name using the mapping in `src/constants/item-sort-order.ts`.

### Output Example

```
========================================
  Sort Order Migration Script
========================================

Updating category sort orders...
  ✓ Updated "Saudi Wear" to sortOrder 1 (1 records)
  ✓ Updated "Tops" to sortOrder 2 (1 records)
  ...

Updating item sort orders...
  ✓ Updated "White Thobe" to sortOrder 1 (15 records)
  ✓ Updated "Colored Thobe" to sortOrder 2 (15 records)
  ...

Total items updated: 930

Checking for items without sort orders...
  ✓ All items have sort orders!

========================================
  Migration completed successfully!
========================================
```

### When to Run

Run this script:
- After deploying the sortOrder schema changes to production
- When you notice items or categories appearing unordered in the API responses
- After manually adding new items that need sort orders

### Safety

- The script only updates items where `sortOrder` is NULL
- It will not overwrite existing sort orders
- All operations are within a database transaction
- You can run it multiple times safely
