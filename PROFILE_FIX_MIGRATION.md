# Profile Fix: Add achievements column to experiences table

## Problem
```
Could Not Load Profile
Unknown column 'achievements' in 'field list'
```

## Root Cause
The `experiences` table schema in `backend/src/db/schema.ts` defines an `achievements` JSON column, but this column doesn't exist in the production database. When `fetchProfileSnapshot()` runs `db.select().from(experiences)`, it tries to select ALL columns including `achievements`, causing the error.

## Solution
Created SQL migration: `backend/sql/2026-05-08-add-achievements-to-experiences.sql`

This migration:
- Checks if `achievements` column exists
- Adds it as JSON type if missing
- Safe to run multiple times (idempotent)
- Adds column AFTER `description` column

## How to Apply Migration

### Option 1: Automatic Script (Recommended)
```bash
# SSH to VPS and run the migration script
ssh root@YOUR_VPS_HOST 'bash -s' < backend/sql/run-achievements-migration.sh
```

### Option 2: Manual SQL
```bash
# SSH to VPS
ssh root@YOUR_VPS_HOST

# Navigate to project
cd /root/project

# Run migration
mysql -h HOST -u USER -pPASS DATABASE < backend/sql/2026-05-08-add-achievements-to-experiences.sql
```

### Option 3: Direct MySQL Command
```bash
# SSH to VPS and run inline
ssh root@YOUR_VPS_HOST 'cd /root/project && source .env && mysql -h $(echo $DATABASE_URL | sed "s/.*@\(.*\):.*/\1/") -u $(echo $DATABASE_URL | sed "s/.*:\/\/\(.*\):.*/\1/") -p$(echo $DATABASE_URL | sed "s/.*:\/\/.*:\(.*\)@.*/\1/") $(echo $DATABASE_URL | sed "s/.*\/\(.*\)\?.*/\1/") < backend/sql/2026-05-08-add-achievements-to-experiences.sql'
```

## Verification

After running migration, verify the column exists:

```sql
SELECT 
  COLUMN_NAME, 
  DATA_TYPE, 
  IS_NULLABLE, 
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'experiences'
  AND COLUMN_NAME = 'achievements';
```

Expected output:
```
+-------------+-----------+-------------+----------------+
| COLUMN_NAME | DATA_TYPE | IS_NULLABLE | COLUMN_DEFAULT |
+-------------+-----------+-------------+----------------+
| achievements| json      | YES         | NULL           |
+-------------+-----------+-------------+----------------+
```

## Files Changed
- ✅ `backend/sql/2026-05-08-add-achievements-to-experiences.sql` - Migration SQL
- ✅ `backend/sql/run-achievements-migration.sh` - Automated migration script
- ✅ `PROFILE_FIX_MIGRATION.md` - This documentation

## Deployment Status
- ✅ Migration files committed: `111ebaf`
- ⏳ **NEEDS MANUAL EXECUTION ON VPS**
- ⏳ After migration, profile page should load without errors

## Next Steps
1. Run migration on VPS using one of the options above
2. Test profile page: https://jobs.multivohub.com/profile
3. Verify no "Unknown column" errors
4. Monitor logs for any other schema mismatches

## Related Schema
The `achievements` column is defined in `backend/src/db/schema.ts`:
```typescript
export const experiences = mysqlTable('experiences', {
  // ... other columns
  achievements: json('achievements'),
  // ...
});
```

But it's currently NOT used in the profile snapshot mapping (line 210-217 in `profile.router.ts`). This means:
- The column needs to exist for SELECT * queries
- But the data isn't currently exposed to frontend
- Future enhancement: expose achievements in profile UI
