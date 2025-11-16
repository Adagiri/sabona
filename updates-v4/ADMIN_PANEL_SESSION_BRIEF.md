# Admin Panel Session - Quick Start Brief

## 🎯 Task
Add loading indicator for reordering + remove category column

## 📝 Changes to Make

1. **Add loading state** to `LaundryServiceItems.tsx`:
   - Import CircularProgress
   - Add `isReordering` state
   - Show 14px spinner during reordering
   - Hide spinner when complete

2. **Remove category column** from items table:
   - Remove category cell from row component
   - Remove category header
   - Update colspan from 8 to 7

## 📂 Files to Modify

- `src/pages/LaundryServiceItems.tsx`

## 📖 Full Instructions

See `INSTRUCTIONS.md` in this folder for step-by-step guide.

## ⏱️ Estimated Time

10 minutes

## 💡 Result

- Small loading spinner appears during drag-and-drop reordering
- Cleaner table without redundant category column
- Category still visible in breadcrumb and page header
