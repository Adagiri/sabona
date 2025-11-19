# Admin Panel - Deletion Error Handling

Update the delete handlers in admin panel pages to display the deletion protection error messages.

## Common Pattern

The backend now returns descriptive error messages when deletion is blocked. Update delete handlers to display these messages in a toast/snackbar.

### Example Update for Laundries Page

In your Laundries list page, update the delete handler:

```typescript
const handleDelete = async (laundryId: string) => {
  try {
    await deleteLaundry(laundryId);
    toast.success('Laundry deleted successfully');
    refetch();
  } catch (error: any) {
    // Display the backend's descriptive error message
    const errorMessage = error?.response?.data?.message || 'Failed to delete laundry';
    toast.error(errorMessage);
  }
};
```

### Pages to Update

1. **Laundries Page** - Handle laundry deletion errors
2. **LaundryServices Page** - Handle service deletion errors
3. **LaundryServiceItems Page** - Handle item deletion errors
4. **LaundryItemCategories Page** - Handle category deletion errors

### Error Messages Users Will See

- `"Cannot delete laundry - it has X active order(s). Complete or cancel them first."`
- `"Cannot delete laundry - it has X pending withdrawal(s). Complete them first."`
- `"Cannot delete service - it is used in X active order(s). Complete or cancel them first."`
- `"Cannot delete item - it is in X active order(s). Complete or cancel them first."`
- `"Cannot delete category - X item(s) are still using it. Reassign or delete items first."`
- `"Cannot delete category - it has X active subcategory/subcategories. Delete subcategories first."`

### Optional: Confirmation Dialog Enhancement

You can enhance the delete confirmation dialog to warn users about potential blocking:

```typescript
const DeleteConfirmDialog = ({ open, onClose, onConfirm, resourceType }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Confirm Deletion</DialogTitle>
    <DialogContent>
      <Typography>
        Are you sure you want to delete this {resourceType}?
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
        Note: Deletion will be blocked if there are active orders or other dependencies.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onConfirm} color="error">Delete</Button>
    </DialogActions>
  </Dialog>
);
```

### Using with React Query

If using React Query mutations:

```typescript
const deleteMutation = useMutation({
  mutationFn: (id: string) => deleteLaundry(id),
  onSuccess: () => {
    toast.success('Laundry deleted successfully');
    queryClient.invalidateQueries(['laundries']);
  },
  onError: (error: any) => {
    const errorMessage = error?.response?.data?.message || 'Failed to delete';
    toast.error(errorMessage);
  },
});
```

## Summary

The key change is to extract and display `error.response.data.message` from the API error response, which now contains descriptive reasons why deletion was blocked.
