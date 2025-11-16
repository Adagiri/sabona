// File: src/pages/LaundryServiceItems.tsx
// Enhanced with CRITICAL FIX (category filtering) + Drag & Drop functionality

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Button,
  IconButton,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Breadcrumbs,
  Link,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Avatar,
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  ArrowBack,
  NavigateNext,
  ImageOutlined,
  DragIndicator,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { useForm, Controller } from 'react-hook-form';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  useFetchLaundryById,
  useFetchLaundryServiceItems,
  useFetchCategories,
} from '../hooks/Admin/query';
import {
  useCreateLaundryServiceItem,
  useDeleteLaundryServiceItem,
  useEditLaundryServiceItem,
  useReorderLaundryServiceItems,
} from '../hooks/Admin/mutation';
import TranslationFields from '../components/TranslationFields';

interface ServiceItem {
  id: string;
  nameLocale: {
    en: string;
    ar: string;
  };
  vendorPrice: number;
  platformPrice: number;
  expressPrice: number;
  categoryId: string;
  category: {
    id: string;
    nameLocale: {
      en: string;
      ar: string;
    };
    icon?: {
      id: number;
      path: string;
      name: string;
      media: {
        path: string;
      };
    };
  };
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  nameLocale: {
    en: string;
    ar: string;
  };
  icon?: {
    id: number;
    path: string;
    name: string;
    media: {
      path: string;
    };
  };
}

interface ItemFormData {
  nameLocale: {
    en: string;
    ar: string;
  };
  vendorPrice: number;
  platformPrice: number;
  expressPrice: number;
  categoryId: string;
}

// Sortable Row Component
function SortableItemRow({
  item,
  onEdit,
  onDelete,
}: {
  item: ServiceItem;
  onEdit: (item: ServiceItem) => void;
  onDelete: (itemId: string, itemName: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} hover>
      <TableCell>
        <IconButton
          {...attributes}
          {...listeners}
          size="small"
          sx={{ cursor: 'grab', '&:active': { cursor: 'grabbing' } }}
        >
          <DragIndicator />
        </IconButton>
      </TableCell>
      <TableCell>
        <Typography variant="body1" fontWeight="bold">
          {item.nameLocale.en}
        </Typography>
      </TableCell>
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={1}>
          {item.category.icon?.media?.path && (
            <Avatar
              src={item.category.icon.media.path}
              sx={{ width: 24, height: 24 }}
              variant="rounded"
            >
              <ImageOutlined fontSize="small" />
            </Avatar>
          )}
          <Chip
            label={item.category.nameLocale.en}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Stack>
      </TableCell>
      <TableCell>
        <Typography variant="body1">{item.vendorPrice.toFixed(2)} SAR</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body1">
          {item.platformPrice.toFixed(2)} SAR
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body1">
          {item.expressPrice.toFixed(2)} SAR
        </Typography>
      </TableCell>
      <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
      <TableCell>
        <Stack direction="row" spacing={1}>
          <IconButton
            size="small"
            onClick={() => onEdit(item)}
            color="warning"
            title="Edit Item"
          >
            <Edit />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onDelete(item.id, item.nameLocale.en)}
            color="error"
            title="Delete Item"
          >
            <Delete />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

const LaundryServiceItems: React.FC = () => {
  // *** CRITICAL FIX: Extract categoryId from params ***
  const { laundryId, serviceId, categoryId } = useParams<{
    laundryId: string;
    serviceId: string;
    categoryId: string; // ADDED
  }>();
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localItems, setLocalItems] = useState<ServiceItem[]>([]);

  const { data: laundry } = useFetchLaundryById(laundryId!);
  const {
    data: items,
    isLoading,
    error,
    refetch,
  } = useFetchLaundryServiceItems(laundryId!, serviceId!);
  const { data: categories } = useFetchCategories();
  const { mutateAsync: createItem } = useCreateLaundryServiceItem();
  const { mutateAsync: editItem } = useEditLaundryServiceItem();
  const { mutateAsync: deleteItem } = useDeleteLaundryServiceItem();
  const { mutateAsync: reorderItems } = useReorderLaundryServiceItems();

  // *** CRITICAL FIX: Filter items by categoryId ***
  const filteredItems = React.useMemo(() => {
    if (!items?.data || !categoryId) return [];
    return items.data.filter((item: ServiceItem) => item.categoryId === categoryId);
  }, [items?.data, categoryId]);

  // Get category name for breadcrumbs
  const currentCategory = React.useMemo(() => {
    if (!categories?.data || !categoryId) return null;
    return categories.data.find((cat: Category) => cat.id === categoryId);
  }, [categories?.data, categoryId]);

  // Get service name from items data
  const serviceName = items?.data?.[0]?.service?.name || 'Service Items';

  // Update local items when filtered data changes
  useEffect(() => {
    setLocalItems([...filteredItems]);
  }, [filteredItems]);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ItemFormData>({
    defaultValues: {
      nameLocale: { en: '', ar: '' },
      vendorPrice: 0,
      platformPrice: 0,
      expressPrice: 0,
      categoryId: categoryId || '', // Pre-fill with current category
    },
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localItems.findIndex((item) => item.id === active.id);
    const newIndex = localItems.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistic update
    const reordered = arrayMove(localItems, oldIndex, newIndex);
    setLocalItems(reordered);

    // Send to backend (category-scoped)
    try {
      const itemIds = reordered.map((item) => item.id);
      await reorderItems({
        laundryId: laundryId!,
        serviceId: serviceId!,
        categoryId: categoryId!, // Category scope
        itemIds,
      });
      toast.success('Items reordered successfully');
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to reorder items');
      // Revert on error
      setLocalItems([...filteredItems]);
    }
  };

  // Fix form population when editing
  useEffect(() => {
    if (editingItem && openDialog && categories?.data?.length) {
      setValue('nameLocale.en', editingItem.nameLocale?.en);
      setValue('nameLocale.ar', editingItem.nameLocale?.ar);
      setValue('vendorPrice', editingItem.vendorPrice);
      setValue('platformPrice', editingItem.platformPrice);
      setValue('expressPrice', editingItem.expressPrice);
      setTimeout(() => {
        setValue('categoryId', editingItem.categoryId);
      }, 500);
    }
  }, [editingItem, openDialog, categories?.data, setValue]);

  const handleCreateItem = () => {
    if (!categories?.data?.length) {
      toast.error('Please create categories first');
      return;
    }
    setEditingItem(null);
    reset({
      nameLocale: { en: '', ar: '' },
      vendorPrice: 0,
      platformPrice: 0,
      expressPrice: 0,
      categoryId: categoryId || '', // Pre-fill with current category
    });
    setOpenDialog(true);
  };

  const handleEditItem = (item: ServiceItem) => {
    if (!categories?.data?.length) {
      toast.error('Categories not loaded');
      return;
    }
    setEditingItem(item);
    setOpenDialog(true);
  };

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (window.confirm(`Are you sure you want to delete "${itemName}"?`)) {
      try {
        await deleteItem({
          laundryId: laundryId!,
          serviceId: serviceId!,
          itemId,
        });
        toast.success('Item deleted successfully');
        refetch();
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to delete item');
      }
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    reset({
      nameLocale: { en: '', ar: '' },
      vendorPrice: 0,
      platformPrice: 0,
      expressPrice: 0,
      categoryId: categoryId || '',
    });
  };

  const onSubmit = async (data: ItemFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        nameLocale: data.nameLocale,
        vendorPrice: Number(data.vendorPrice),
        platformPrice: Number(data.platformPrice),
        expressPrice: Number(data.expressPrice),
        categoryId: data.categoryId,
      };

      if (editingItem) {
        await editItem({
          laundryId: laundryId!,
          serviceId: serviceId!,
          itemId: editingItem.id,
          data: payload,
        });
        toast.success('Item updated successfully');
      } else {
        await createItem({
          laundryId: laundryId!,
          serviceId: serviceId!,
          data: { items: [payload] },
        });
        toast.success('Item created successfully');
      }
      handleCloseDialog();
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save item');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <Typography>Loading items...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load items:{' '}
          {(error as any)?.response?.data?.message || 'Unknown error'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <ToastContainer />

      {/* Breadcrumbs - UPDATED to show category name */}
      <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/laundry')}
          sx={{ textDecoration: 'none' }}
        >
          Laundry Management
        </Link>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate(`/laundry/${laundryId}/services`)}
          sx={{ textDecoration: 'none' }}
        >
          {laundry?.data?.name || 'Services'}
        </Link>
        <Link
          component="button"
          variant="body1"
          onClick={() =>
            navigate(`/laundry/${laundryId}/service/${serviceId}/categories`)
          }
          sx={{ textDecoration: 'none' }}
        >
          {serviceName}
        </Link>
        <Typography color="text.primary">
          {currentCategory?.nameLocale.en || 'Items'}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton
              onClick={() =>
                navigate(`/laundry/${laundryId}/service/${serviceId}/categories`)
              }
            >
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                {currentCategory?.nameLocale.en || 'Category'} - Items
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage items for this category (drag to reorder)
              </Typography>
            </Box>
          </Stack>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateItem}
        >
          Add Item
        </Button>
      </Stack>

      {/* Check if categories exist before allowing item creation */}
      {(!categories?.data || categories.data.length === 0) && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            No Categories Available
          </Typography>
          <Typography variant="body2">
            You need to create at least one category before adding service items.
            <Button
              size="small"
              sx={{ ml: 1 }}
              onClick={() => navigate('/laundry/categories')}
            >
              Manage Categories
            </Button>
          </Typography>
        </Alert>
      )}

      {/* Service Info */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
        <Stack direction="row" spacing={3}>
          <Typography variant="body2">
            <strong>Laundry:</strong> {laundry?.data?.name}
          </Typography>
          <Typography variant="body2">
            <strong>Service:</strong> {serviceName}
          </Typography>
          <Typography variant="body2">
            <strong>Category:</strong> {currentCategory?.nameLocale.en || 'N/A'}
          </Typography>
          <Typography variant="body2">
            <strong>Items in Category:</strong> {localItems?.length || 0}
          </Typography>
        </Stack>
      </Paper>

      {/* Items Table with Drag & Drop */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell width={50}>
                <strong>Order</strong>
              </TableCell>
              <TableCell>
                <strong>Item Name</strong>
              </TableCell>
              <TableCell>
                <strong>Category</strong>
              </TableCell>
              <TableCell>
                <strong>Vendor Price</strong>
              </TableCell>
              <TableCell>
                <strong>Platform Price</strong>
              </TableCell>
              <TableCell>
                <strong>Express Price</strong>
              </TableCell>
              <TableCell>
                <strong>Created</strong>
              </TableCell>
              <TableCell>
                <strong>Actions</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {localItems?.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={localItems.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {localItems.map((item: ServiceItem) => (
                    <SortableItemRow
                      key={item.id}
                      item={item}
                      onEdit={handleEditItem}
                      onDelete={handleDeleteItem}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body1" color="text.secondary" py={4}>
                    No items found in this category. Create your first item to get
                    started.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Create/Edit Item Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {editingItem ? 'Edit Item' : 'Create New Item'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TranslationFields
                control={control}
                fieldName="nameLocale"
                label="Item Name"
                errors={errors}
                required={true}
              />

              <Controller
                name="vendorPrice"
                control={control}
                rules={{
                  required: 'Vendor price is required',
                  min: { value: 0.01, message: 'Price must be greater than 0' },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Vendor Price (SAR)"
                    type="number"
                    fullWidth
                    inputProps={{ step: '0.01', min: '0.01' }}
                    error={!!errors.vendorPrice}
                    helperText={errors.vendorPrice?.message}
                  />
                )}
              />

              <Controller
                name="platformPrice"
                control={control}
                rules={{
                  required: 'Platform price is required',
                  min: { value: 0.01, message: 'Price must be greater than 0' },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Platform Price (SAR)"
                    type="number"
                    fullWidth
                    inputProps={{ step: '0.01', min: '0.01' }}
                    error={!!errors.platformPrice}
                    helperText={errors.platformPrice?.message}
                  />
                )}
              />

              <Controller
                name="expressPrice"
                control={control}
                rules={{
                  required: 'Express price is required',
                  min: { value: 0.01, message: 'Price must be greater than 0' },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Express Price (SAR)"
                    type="number"
                    fullWidth
                    inputProps={{ step: '0.01', min: '0.01' }}
                    error={!!errors.expressPrice}
                    helperText={errors.expressPrice?.message}
                  />
                )}
              />

              <Controller
                name="categoryId"
                control={control}
                rules={{ required: 'Category is required' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.categoryId}>
                    <InputLabel>Category *</InputLabel>
                    <Select
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      label="Category *"
                    >
                      {categories?.data?.map((category: Category) => (
                        <MenuItem key={category.id} value={category.id}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {category.icon?.media?.path && (
                              <Avatar
                                src={category.icon.media.path}
                                sx={{ width: 20, height: 20 }}
                                variant="rounded"
                              >
                                <ImageOutlined fontSize="small" />
                              </Avatar>
                            )}
                            <Typography>{category.nameLocale.en}</Typography>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.categoryId && (
                      <FormHelperText>{errors.categoryId.message}</FormHelperText>
                    )}
                    {!categories?.data?.length && (
                      <FormHelperText>
                        No categories available. Please create categories first.
                      </FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!categories?.data?.length || isSubmitting}
            >
              {isSubmitting
                ? editingItem
                  ? 'Updating...'
                  : 'Creating...'
                : editingItem
                ? 'Update'
                : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default LaundryServiceItems;
