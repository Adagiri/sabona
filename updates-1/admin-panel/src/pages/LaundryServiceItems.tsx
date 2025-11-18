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
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { useForm, Controller } from 'react-hook-form';
import {
  useFetchLaundryById,
  useFetchLaundryServiceItems,
  useFetchCategories,
} from '../hooks/Admin/query';
import {
  useCreateLaundryServiceItem,
  useDeleteLaundryServiceItem,
  useEditLaundryServiceItem,
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
  expressVendorPrice: number;
  expressPlatformPrice: number;
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
  expressVendorPrice: number;
  expressPlatformPrice: number;
  categoryId: string;
}

const LaundryServiceItems: React.FC = () => {
  const { laundryId, serviceId } = useParams<{
    laundryId: string;
    serviceId: string;
  }>();
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Get service name from items data
  const serviceName = items?.data?.[0]?.service?.name || 'Service Items';

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
      expressVendorPrice: 0,
      expressPlatformPrice: 0,
      categoryId: '',
    },
  });

  // Fix form population when editing
  useEffect(() => {
    if (editingItem && openDialog && categories?.data?.length) {
      // Set translation fields
      setValue('nameLocale.en', editingItem.nameLocale?.en);
      setValue('nameLocale.ar', editingItem.nameLocale?.ar);

      setValue('vendorPrice', editingItem.vendorPrice);
      setValue('platformPrice', editingItem.platformPrice);
      setValue('expressVendorPrice', editingItem.expressVendorPrice);
      setValue('expressPlatformPrice', editingItem.expressPlatformPrice);
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
      expressVendorPrice: 0,
      expressPlatformPrice: 0,
      categoryId: '',
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
      expressVendorPrice: 0,
      expressPlatformPrice: 0,
      categoryId: '',
    });
  };

  const onSubmit = async (data: ItemFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        nameLocale: data.nameLocale,
        vendorPrice: Number(data.vendorPrice),
        platformPrice: Number(data.platformPrice),
        expressVendorPrice: Number(data.expressVendorPrice),
        expressPlatformPrice: Number(data.expressPlatformPrice),
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
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='60vh'
      >
        <Typography>Loading items...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity='error'>
          Failed to load items:{' '}
          {(error as any)?.response?.data?.message || 'Unknown error'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <ToastContainer />

      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNext fontSize='small' />} sx={{ mb: 2 }}>
        <Link
          component='button'
          variant='body1'
          onClick={() => navigate('/laundry')}
          sx={{ textDecoration: 'none' }}
        >
          Laundry Management
        </Link>
        <Link
          component='button'
          variant='body1'
          onClick={() => navigate(`/laundry/${laundryId}/services`)}
          sx={{ textDecoration: 'none' }}
        >
          {laundry?.data?.name || 'Services'}
        </Link>
        <Typography color='text.primary'>{serviceName}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Stack
        direction='row'
        justifyContent='space-between'
        alignItems='center'
        mb={3}
      >
        <Box>
          <Stack direction='row' alignItems='center' spacing={2}>
            <IconButton
              onClick={() => navigate(`/laundry/${laundryId}/services`)}
            >
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant='h4' fontWeight='bold'>
                {serviceName} - Items
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Manage items for this service
              </Typography>
            </Box>
          </Stack>
        </Box>
        <Button
          variant='contained'
          startIcon={<Add />}
          onClick={handleCreateItem}
        >
          Add Item
        </Button>
      </Stack>

      {/* Check if categories exist before allowing item creation */}
      {(!categories?.data || categories.data.length === 0) && (
        <Alert severity='warning' sx={{ mb: 3 }}>
          <Typography variant='subtitle2' gutterBottom>
            No Categories Available
          </Typography>
          <Typography variant='body2'>
            You need to create at least one category before adding service
            items.
            <Button
              size='small'
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
        <Stack direction='row' spacing={3}>
          <Typography variant='body2'>
            <strong>Laundry:</strong> {laundry?.data?.name}
          </Typography>
          <Typography variant='body2'>
            <strong>Service:</strong> {serviceName}
          </Typography>
          <Typography variant='body2'>
            <strong>Total Items:</strong> {items?.data?.length || 0}
          </Typography>
          <Typography variant='body2'>
            <strong>Available Categories:</strong>{' '}
            {categories?.data?.length || 0}
          </Typography>
        </Stack>
      </Paper>

      {/* Items Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
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
                <strong>Express Vendor</strong>
              </TableCell>
              <TableCell>
                <strong>Express Platform</strong>
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
            {items?.data?.length > 0 ? (
              items.data.map((item: ServiceItem) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography variant='body1' fontWeight='bold'>
                      {item.nameLocale.en}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction='row' alignItems='center' spacing={1}>
                      {item.category?.icon?.media?.path && (
                        <Avatar
                          src={item.category.icon.media.path}
                          sx={{ width: 24, height: 24 }}
                          variant='rounded'
                        >
                          <ImageOutlined fontSize='small' />
                        </Avatar>
                      )}
                      <Chip
                        label={item.category?.nameLocale?.en || 'N/A'}
                        size='small'
                        color='primary'
                        variant='outlined'
                      />
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body1'>
                      {item.vendorPrice?.toFixed(2)} SAR
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body1'>
                      {item.platformPrice?.toFixed(2)} SAR
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body1'>
                      {item.expressVendorPrice?.toFixed(2) || 'N/A'} SAR
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body1'>
                      {item.expressPlatformPrice?.toFixed(2) || 'N/A'} SAR
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Stack direction='row' spacing={1}>
                      <IconButton
                        size='small'
                        onClick={() => handleEditItem(item)}
                        color='warning'
                        title='Edit Item'
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size='small'
                        onClick={() => handleDeleteItem(item.id, item.nameLocale.en)}
                        color='error'
                        title='Delete Item'
                      >
                        <Delete />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align='center'>
                  <Typography variant='body1' color='text.secondary' py={4}>
                    No items found. Create your first item to get started.
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
        maxWidth='sm'
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
                fieldName='nameLocale'
                label='Item Name'
                errors={errors}
                required={true}
              />

              <Typography variant='subtitle2' color='text.secondary'>
                Normal Delivery Pricing
              </Typography>

              <Controller
                name='vendorPrice'
                control={control}
                rules={{
                  required: 'Vendor price is required',
                  min: { value: 0.01, message: 'Price must be greater than 0' },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label='Vendor Price (SAR)'
                    type='number'
                    fullWidth
                    inputProps={{ step: '0.01', min: '0.01' }}
                    error={!!errors.vendorPrice}
                    helperText={errors.vendorPrice?.message || 'What vendor receives for normal delivery'}
                  />
                )}
              />

              <Controller
                name='platformPrice'
                control={control}
                rules={{
                  required: 'Platform price is required',
                  min: { value: 0.01, message: 'Price must be greater than 0' },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label='Platform Price (SAR)'
                    type='number'
                    fullWidth
                    inputProps={{ step: '0.01', min: '0.01' }}
                    error={!!errors.platformPrice}
                    helperText={errors.platformPrice?.message || 'What customer pays for normal delivery'}
                  />
                )}
              />

              <Typography variant='subtitle2' color='text.secondary'>
                Express Delivery Pricing
              </Typography>

              <Controller
                name='expressVendorPrice'
                control={control}
                rules={{
                  required: 'Express vendor price is required',
                  min: { value: 0.01, message: 'Price must be greater than 0' },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label='Express Vendor Price (SAR)'
                    type='number'
                    fullWidth
                    inputProps={{ step: '0.01', min: '0.01' }}
                    error={!!errors.expressVendorPrice}
                    helperText={errors.expressVendorPrice?.message || 'What vendor receives for express delivery'}
                  />
                )}
              />

              <Controller
                name='expressPlatformPrice'
                control={control}
                rules={{
                  required: 'Express platform price is required',
                  min: { value: 0.01, message: 'Price must be greater than 0' },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label='Express Platform Price (SAR)'
                    type='number'
                    fullWidth
                    inputProps={{ step: '0.01', min: '0.01' }}
                    error={!!errors.expressPlatformPrice}
                    helperText={errors.expressPlatformPrice?.message || 'What customer pays for express delivery'}
                  />
                )}
              />

              <Controller
                name='categoryId'
                control={control}
                rules={{ required: 'Category is required' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.categoryId}>
                    <InputLabel>Category *</InputLabel>
                    <Select
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      label='Category *'
                    >
                      {categories?.data?.map((category: Category) => (
                        <MenuItem key={category.id} value={category.id}>
                          <Stack
                            direction='row'
                            alignItems='center'
                            spacing={1}
                          >
                            {category.icon?.media?.path && (
                              <Avatar
                                src={category.icon.media.path}
                                sx={{ width: 20, height: 20 }}
                                variant='rounded'
                              >
                                <ImageOutlined fontSize='small' />
                              </Avatar>
                            )}
                            <Typography>{category.nameLocale.en}</Typography>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.categoryId && (
                      <FormHelperText>
                        {errors.categoryId.message}
                      </FormHelperText>
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
              type='submit'
              variant='contained'
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
