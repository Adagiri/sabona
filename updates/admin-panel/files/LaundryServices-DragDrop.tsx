// File: src/pages/LaundryServices.tsx
// Enhanced with Drag & Drop functionality using @dnd-kit

import React, { useState } from 'react';
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
  Breadcrumbs,
  Link,
  Alert,
  Avatar,
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  ArrowBack,
  Inventory,
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
  useFetchLaundryServices,
} from '../hooks/Admin/query';
import {
  useCreateLaundryService,
  useDeleteLaundryService,
  useEditLaundryService,
  useReorderLaundryServices,
} from '../hooks/Admin/mutation';
import IconPicker from '../components/IconPicker';
import TranslationFields from '../components/TranslationFields';

interface Service {
  id: string;
  nameLocale: {
    en: string;
    ar: string;
  };
  descriptionLocale: {
    en: string;
    ar: string;
  };
  iconId?: number;
  icon?: {
    id: number;
    path: string;
    name: string;
    media: {
      path: string;
    };
  };
  laundryId: string;
  createdAt: string;
  updatedAt: string;
  sortOrder?: number;
  _count?: {
    laundryServiceItems: number;
  };
}

interface ServiceFormData {
  nameLocale: {
    en: string;
    ar: string;
  };
  descriptionLocale?: {
    en: string;
    ar: string;
  };
  iconId?: number;
}

// Sortable Row Component
function SortableServiceRow({
  service,
  onEdit,
  onDelete,
  onViewItems,
}: {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (serviceId: string, serviceName: string) => void;
  onViewItems: (serviceId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: service.id });

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
        <Avatar
          src={service.icon?.media.path}
          sx={{ width: 40, height: 40 }}
          variant="rounded"
        >
          <ImageOutlined />
        </Avatar>
      </TableCell>
      <TableCell>
        <Typography variant="body1" fontWeight="bold">
          {service.nameLocale.en}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {service.descriptionLocale.en || 'No description'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {service._count?.laundryServiceItems || 0} items
        </Typography>
      </TableCell>
      <TableCell>
        <Chip label="Active" color="success" size="small" />
      </TableCell>
      <TableCell>
        {new Date(service.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <Stack direction="row" spacing={1}>
          <IconButton
            size="small"
            onClick={() => onViewItems(service.id)}
            color="primary"
            title="View Items"
          >
            <Inventory />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onEdit(service)}
            color="warning"
            title="Edit Service"
          >
            <Edit />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onDelete(service.id, service.nameLocale.en)}
            color="error"
            title="Delete Service"
          >
            <Delete />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

const LaundryServices: React.FC = () => {
  const { laundryId } = useParams<{ laundryId: string }>();
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localServices, setLocalServices] = useState<Service[]>([]);

  const { data: laundry } = useFetchLaundryById(laundryId!);
  const {
    data: services,
    isLoading,
    error,
    refetch,
  } = useFetchLaundryServices(laundryId!);
  const { mutateAsync: createService } = useCreateLaundryService();
  const { mutateAsync: editService } = useEditLaundryService();
  const { mutateAsync: deleteService } = useDeleteLaundryService();
  const { mutateAsync: reorderServices } = useReorderLaundryServices();

  // Update local services when data changes
  React.useEffect(() => {
    if (services?.data) {
      setLocalServices([...services.data]);
    }
  }, [services?.data]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceFormData>({
    defaultValues: {
      nameLocale: { en: '', ar: '' },
      descriptionLocale: { en: '', ar: '' },
      iconId: undefined,
    },
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required to start drag
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

    const oldIndex = localServices.findIndex((s) => s.id === active.id);
    const newIndex = localServices.findIndex((s) => s.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistic update
    const reordered = arrayMove(localServices, oldIndex, newIndex);
    setLocalServices(reordered);

    // Send to backend
    try {
      const serviceIds = reordered.map((s) => s.id);
      await reorderServices({
        laundryId: laundryId!,
        serviceIds,
      });
      toast.success('Services reordered successfully');
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to reorder services');
      // Revert on error
      setLocalServices([...services.data]);
    }
  };

  const handleCreateService = () => {
    setEditingService(null);
    reset({
      nameLocale: { en: '', ar: '' },
      descriptionLocale: { en: '', ar: '' },
      iconId: undefined,
    });
    setOpenDialog(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    reset({
      nameLocale: {
        en: service.nameLocale.en,
        ar: service.nameLocale?.ar,
      },
      descriptionLocale: {
        en: service.descriptionLocale.en || '',
        ar: service.descriptionLocale?.ar,
      },
      iconId: service.iconId,
    });
    setOpenDialog(true);
  };

  const handleDeleteService = async (
    serviceId: string,
    serviceName: string
  ) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${serviceName}"? This will also delete all associated items.`
      )
    ) {
      try {
        await deleteService({ laundryId: laundryId!, serviceId });
        toast.success('Service deleted successfully');
        refetch();
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || 'Failed to delete service'
        );
      }
    }
  };

  const onSubmit = async (data: ServiceFormData) => {
    setIsSubmitting(true);
    try {
      if (editingService) {
        await editService({
          laundryId: laundryId!,
          serviceId: editingService.id,
          data,
        });
        toast.success('Service updated successfully');
      } else {
        await createService({
          laundryId: laundryId!,
          data,
        });
        toast.success('Service created successfully');
      }

      setOpenDialog(false);
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewItems = (serviceId: string) => {
    navigate(`/laundry/${laundryId}/service/${serviceId}/categories`);
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <Typography>Loading services...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load services:{' '}
          {(error as any)?.response?.data?.message || 'Unknown error'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <ToastContainer />

      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/laundry')}
          sx={{ textDecoration: 'none' }}
        >
          Laundry Management
        </Link>
        <Typography color="text.primary">
          {laundry?.data?.name || 'Services'}
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
            <IconButton onClick={() => navigate('/laundry')}>
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                {laundry?.data?.name} - Services
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage services for this laundry (drag to reorder)
              </Typography>
            </Box>
          </Stack>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateService}
        >
          Add Service
        </Button>
      </Stack>

      {/* Laundry Info */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
        <Stack direction="row" spacing={3}>
          <Typography variant="body2">
            <strong>Laundry:</strong> {laundry?.data?.name}
          </Typography>
          <Typography variant="body2">
            <strong>Location:</strong> {laundry?.data?.address}
          </Typography>
          <Typography variant="body2">
            <strong>Total Services:</strong> {localServices?.length || 0}
          </Typography>
        </Stack>
      </Paper>

      {/* Services Table with Drag & Drop */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell width={50}>
                <strong>Order</strong>
              </TableCell>
              <TableCell>
                <strong>Icon</strong>
              </TableCell>
              <TableCell>
                <strong>Service Name</strong>
              </TableCell>
              <TableCell>
                <strong>Description</strong>
              </TableCell>
              <TableCell>
                <strong>Items</strong>
              </TableCell>
              <TableCell>
                <strong>Status</strong>
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
            {localServices?.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={localServices.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {localServices.map((service: Service) => (
                    <SortableServiceRow
                      key={service.id}
                      service={service}
                      onEdit={handleEditService}
                      onDelete={handleDeleteService}
                      onViewItems={handleViewItems}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body1" color="text.secondary" py={4}>
                    No services found. Create your first service to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Create/Edit Service Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {editingService ? 'Edit Service' : 'Create New Service'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TranslationFields
                control={control}
                fieldName="nameLocale"
                label="Service Name"
                errors={errors}
                required={true}
              />

              <TranslationFields
                control={control}
                fieldName="descriptionLocale"
                label="Description"
                errors={errors}
                required={false}
                multiline={true}
                rows={3}
              />

              <Controller
                name="iconId"
                control={control}
                render={({ field }) => (
                  <IconPicker
                    selectedIconId={field.value}
                    onSelect={(iconId) => field.onChange(iconId)}
                    filterType="SERVICE"
                    label="Service Icon (Optional)"
                    error={!!errors.iconId}
                    helperText={errors.iconId?.message}
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting
                ? editingService
                  ? 'Updating...'
                  : 'Creating...'
                : editingService
                ? 'Update'
                : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default LaundryServices;
