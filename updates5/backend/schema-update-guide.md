# Schema Update Guide: Change Default Language to Arabic

## File: backend/prisma/schema.prisma

## Change Required

**Find (Line ~206):**
```prisma
preferredLanguage String? @default("en") // User's preferred language for notifications (en, ar)
```

**Replace with:**
```prisma
preferredLanguage String? @default("ar") // User's preferred language for notifications (en, ar)
```

---

## Implementation Steps

### Option 1: Using Prisma Migrate (Recommended)

```bash
# 1. Update schema.prisma as shown above
cd backend

# 2. Create a new migration
npx prisma migrate dev --name change_default_language_to_arabic

# 3. Prisma will automatically generate the migration
# The generated migration will include the ALTER TABLE statement

# 4. Apply the migration (if not auto-applied)
npx prisma migrate deploy
```

### Option 2: Manual SQL Execution

If you prefer to run the SQL directly:

```bash
# 1. Update schema.prisma as shown above

# 2. Run the migration SQL
psql -U your_username -d your_database -f updates5/backend/migration-arabic-default.sql

# 3. Update Prisma Client
npx prisma generate
```

---

## Verification

After applying the migration, verify the changes:

### 1. Check Database Default

```sql
SELECT column_default 
FROM information_schema.columns  
WHERE table_name = 'User' 
  AND column_name = 'preferredLanguage';
```

**Expected result:** `'ar'::text` or `'ar'`

### 2. Check User Distribution

```sql
SELECT preferredLanguage, COUNT(*) as count
FROM "User"
GROUP BY preferredLanguage;
```

**Expected result:**
```
preferredLanguage | count
------------------+-------
ar                | (most users)
en                | (some users)
(null)            | 0 (should be none)
```

### 3. Test New User Creation

```typescript
// In your application or API client
const newUser = await prisma.user.create({
  data: {
    phone: '+966555555555',
    type: 'USER',
    // Don't specify preferredLanguage - it should default to 'ar'
  },
});

console.log(newUser.preferredLanguage); // Should be 'ar'
```

---

## Important Notes

1. **Existing Users**: The migration updates NULL values to 'ar' but does NOT change existing 'en' users
   - If you want to migrate all existing English users to Arabic, uncomment the optional step in the migration SQL

2. **New Users**: All new users created after this change will default to Arabic

3. **User Choice**: Users can still change their language preference through the app

4. **Backwards Compatibility**: The system still supports both 'en' and 'ar'

---

## Rollback Plan

If you need to revert to English as default:

```sql
BEGIN;

-- Revert default
ALTER TABLE "User" ALTER COLUMN "preferredLanguage" SET DEFAULT 'en';

-- Optionally update users back to English
UPDATE "User" SET "preferredLanguage" = 'en' WHERE "preferredLanguage" = 'ar';

COMMIT;
```

Then update schema.prisma back to `@default("en")`

---

**Status**: Ready to implement  
**Impact**: Low (only affects new user defaults)  
**Reversible**: Yes
