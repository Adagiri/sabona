# Backend Updates V4 - Implementation Instructions

## 📝 Changes Summary

Add category name validation to prevent invalid category names from being saved.

---

## Step 1: Update editLaundryItemCategory Method

**File:** `src/modules/app/vendor/vendor.service.ts`

**Location:** In the `editLaundryItemCategory` method (around line 1590)

**Find this section:**

```typescript
const updateData: any = {};

// Handle name translation
if (data.nameLocale) {
    updateData.nameLocale = data.nameLocale;
    updateData.name = data.nameLocale.en; // Auto-populate from English
}

// Handle description translation
```

**Replace with:**

```typescript
const updateData: any = {};

// Handle name translation
if (data.nameLocale) {
    // Validate category name against allowed names
    const allowedCategoryNames = Object.keys(CATEGORY_SORT_ORDER);
    if (!allowedCategoryNames.includes(data.nameLocale.en)) {
        throw new BadRequestException(
            `Category name must be one of: ${allowedCategoryNames.join(', ')}`
        );
    }

    updateData.nameLocale = data.nameLocale;
    updateData.name = data.nameLocale.en; // Auto-populate from English
}

// Handle description translation
```

---

## ✅ Allowed Category Names

The validation only accepts these exact names (case-sensitive):
- `Saudi Wear`
- `Tops`
- `Bottoms`
- `Suits / Uniforms`
- `Under Wear`
- `Bed & Bath`

---

## ✅ Testing

1. Try editing a category with a valid name (e.g., "Tops") - should succeed
2. Try editing a category with an invalid name (e.g., "New Category") - should fail with error:
   ```
   Category name must be one of: Saudi Wear, Tops, Bottoms, Suits / Uniforms, Under Wear, Bed & Bath
   ```

---

## 🚀 Deployment

```bash
git add -A
git commit -m "feat: Add category name validation on edit"
git push origin dev
```

---

## 📌 Notes

- Validation uses `CATEGORY_SORT_ORDER` keys (already imported)
- Error message lists all allowed category names
- Validation is case-sensitive
