import React, { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Card,
  CardContent,
  Stack,
  Button,
  IconButton,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  ArrowBack,
  Person,
  Phone,
  Email,
  LocationOn,
  AttachMoney,
  Assignment,
  LocalShipping,
  CheckCircle,
  Schedule,
  Store,
  Receipt,
  DriveEta,
  AccessTime,
  Edit,
  LocalLaundryService,
  StarRate,
  Cancel,
} from '@mui/icons-material';
import { useFetchOrderDetails } from '../hooks/Admin/query';
import { toast } from 'react-toastify';
import {
  useCancelOrder,
  useAcceptOrder,
} from '../hooks/Admin/mutations/customOrders';
import {
  useAcceptPickupRide,
  useMarkPickedUp,
  useMarkDroppedAtVendor,
  useMarkReadyForDelivery,
  useAcceptDeliveryRide,
  useMarkDelivered,
  useAddOrderNotes,
} from '../hooks/Admin/mutations/orders';

const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const {
    data: orderDetails,
    isLoading,
    error,
    refetch,
  } = useFetchOrderDetails(orderId || '');

  // State management
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [refundCustomer, setRefundCustomer] = useState(false);

  // Mutations
  const cancelMutation = useCancelOrder();
  const acceptOrderMutation = useAcceptOrder();
  const acceptPickupRideMutation = useAcceptPickupRide();
  const markPickedUpMutation = useMarkPickedUp();
  const markDroppedAtVendorMutation = useMarkDroppedAtVendor();
  const markReadyMutation = useMarkReadyForDelivery();
  const acceptDeliveryRideMutation = useAcceptDeliveryRide();
  const markDeliveredMutation = useMarkDelivered();
  const addNotesMutation = useAddOrderNotes();

  // Event handlers
  const handleBack = useCallback(() => {
    navigate('/order');
  }, [navigate]);

  const handleRefresh = useCallback(() => {
    refetch();
    toast.success('Order details refreshed');
  }, [refetch]);

  const handleSaveNotes = useCallback(async () => {
    if (!adminNotes.trim()) {
      toast.error('Please enter some notes');
      return;
    }

    try {
      await addNotesMutation.mutateAsync({
        orderId: orderId!,
        notes: adminNotes,
      });
      setNotesDialogOpen(false);
      setAdminNotes('');
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
  }, [adminNotes, orderId, addNotesMutation]);

  const handleAcceptOrder = useCallback(async () => {
    if (!orderId) return;

    try {
      await acceptOrderMutation.mutateAsync(orderId);
      await refetch();
    } catch (error) {
      console.error('Failed to accept order:', error);
    }
  }, [orderId, acceptOrderMutation, refetch]);

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    try {
      await cancelMutation.mutateAsync({
        orderId: orderId!,
        reason: cancelReason,
        refundCustomer,
      });
      setCancelDialogOpen(false);
      setCancelReason('');
      setRefundCustomer(false);
    } catch (error) {
      console.error('Failed to cancel order:', error);
    }
  };

  // Driver and vendor action handlers
  const handleAcceptPickupRide = useCallback(async () => {
    if (!orderId) return;
    try {
      await acceptPickupRideMutation.mutateAsync(orderId);
      await refetch();
    } catch (error) {
      console.error('Failed to accept pickup ride:', error);
    }
  }, [orderId, acceptPickupRideMutation, refetch]);

  const handleMarkPickedUp = useCallback(async () => {
    if (!orderId) return;
    try {
      await markPickedUpMutation.mutateAsync(orderId);
      await refetch();
    } catch (error) {
      console.error('Failed to mark as picked up:', error);
    }
  }, [orderId, markPickedUpMutation, refetch]);

  const handleMarkDroppedAtVendor = useCallback(async () => {
    if (!orderId) return;
    try {
      await markDroppedAtVendorMutation.mutateAsync(orderId);
      await refetch();
    } catch (error) {
      console.error('Failed to mark as dropped at vendor:', error);
    }
  }, [orderId, markDroppedAtVendorMutation, refetch]);

  const handleMarkReady = useCallback(async () => {
    if (!orderId) return;
    try {
      await markReadyMutation.mutateAsync(orderId);
      await refetch();
    } catch (error) {
      console.error('Failed to mark as ready:', error);
    }
  }, [orderId, markReadyMutation, refetch]);

  const handleAcceptDeliveryRide = useCallback(async () => {
    if (!orderId) return;
    try {
      await acceptDeliveryRideMutation.mutateAsync(orderId);
      await refetch();
    } catch (error) {
      console.error('Failed to accept delivery ride:', error);
    }
  }, [orderId, acceptDeliveryRideMutation, refetch]);

  const handleMarkDelivered = useCallback(async () => {
    if (!orderId) return;
    try {
      await markDeliveredMutation.mutateAsync(orderId);
      await refetch();
    } catch (error) {
      console.error('Failed to mark as delivered:', error);
    }
  }, [orderId, markDeliveredMutation, refetch]);

  // Utility functions
  const getStatusColor = (
    status: string
  ):
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning' => {
    const colors: Record<
      string,
      | 'default'
      | 'primary'
      | 'secondary'
      | 'error'
      | 'info'
      | 'success'
      | 'warning'
    > = {
      PENDING: 'warning',
      PENDING_PAYMENT: 'info',
      ACCEPTED: 'primary',
      IN_PROGRESS: 'secondary',
      READY_FOR_PICKUP: 'info',
      COMPLETED: 'success',
      CANCELLED: 'error',
      REJECTED: 'error',
    };
    return colors[status] || 'default';
  };

  const formatCurrency = (amount: number) => `${amount.toFixed(2)} SAR`;

  const getItemPrice = (item: any) => {
    if (orderDetails?.deliveryType === 'EXPRESS') {
      return item.expressPlatformPriceSnapshot || item.platformPriceSnapshot || 0;
    }
    return item.platformPriceSnapshot || 0;
  };

  const getVendorPrice = (item: any) => {
    if (orderDetails?.deliveryType === 'EXPRESS') {
      return item.expressVendorPriceSnapshot || item.vendorPriceSnapshot || 0;
    }
    return item.vendorPriceSnapshot || 0;
  };

  const getOrderWorkflowSteps = () => [
    {
      label: 'Order Placed',
      description: 'Customer placed order and payment confirmed',
      completed: true,
      icon: <Assignment />,
    },
    {
      label: 'Vendor Accepted',
      description: 'Laundry vendor accepted the order',
      completed: orderDetails?.status !== 'PENDING',
      icon: <Store />,
    },
    {
      label: 'In Progress',
      description: 'Order is being processed by vendor',
      completed: ['IN_PROGRESS', 'READY_FOR_PICKUP', 'COMPLETED'].includes(
        orderDetails?.status || ''
      ),
      icon: <LocalLaundryService />,
    },
    {
      label: 'Pickup Assigned',
      description: 'Pickup driver assigned and dispatched',
      completed: !!orderDetails?.pickup?.rider,
      icon: <DriveEta />,
    },
    {
      label: 'Items Collected',
      description: 'Driver collected items from customer',
      completed:
        orderDetails?.status === 'READY_FOR_PICKUP' ||
        orderDetails?.status === 'COMPLETED',
      icon: <CheckCircle />,
    },
    {
      label: 'Delivery Assigned',
      description: 'Delivery driver assigned',
      completed: !!orderDetails?.delivery?.rider,
      icon: <LocalShipping />,
    },
    {
      label: 'Completed',
      description: 'Order delivered to customer',
      completed: orderDetails?.status === 'COMPLETED',
      icon: <CheckCircle />,
    },
  ];

  // Get next available actions based on order status and pickup/delivery status
  const getNextActions = () => {
    if (!orderDetails) return [];

    const actions = [];
    const { status, pickup, delivery } = orderDetails;

    // Driver pickup actions
    if (status === 'ACCEPTED' && pickup?.status === 'PENDING') {
      actions.push({
        label: 'Accept Pickup Ride (Driver)',
        handler: handleAcceptPickupRide,
        color: 'success' as const,
        icon: <CheckCircle />,
      });
    }

    if (status === 'ACCEPTED' && pickup?.status === 'ACCEPTED') {
      actions.push({
        label: 'Mark Picked Up (Driver)',
        handler: handleMarkPickedUp,
        color: 'primary' as const,
        icon: <DriveEta />,
      });
    }

    if (status === 'ACCEPTED' && pickup?.status === 'PICKED_UP') {
      actions.push({
        label: 'Mark Dropped at Vendor (Driver)',
        handler: handleMarkDroppedAtVendor,
        color: 'info' as const,
        icon: <Store />,
      });
    }

    // Vendor action
    if (status === 'IN_PROGRESS') {
      actions.push({
        label: 'Mark Ready (Vendor)',
        handler: handleMarkReady,
        color: 'warning' as const,
        icon: <AccessTime />,
      });
    }

    // Driver delivery actions
    if (status === 'READY_FOR_PICKUP' && delivery?.status === 'PENDING') {
      actions.push({
        label: 'Accept Delivery Ride (Driver)',
        handler: handleAcceptDeliveryRide,
        color: 'success' as const,
        icon: <CheckCircle />,
      });
    }

    if (status === 'READY_FOR_PICKUP' && delivery?.status === 'ACCEPTED') {
      actions.push({
        label: 'Mark Delivered (Driver)',
        handler: handleMarkDelivered,
        color: 'primary' as const,
        icon: <LocalShipping />,
      });
    }

    return actions;
  };

  if (isLoading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='60vh'
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error || !orderDetails) {
    return (
      <Box p={4}>
        <Alert severity='error'>
          Failed to load order details. Please try again.
          <Button onClick={handleRefresh} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      </Box>
    );
  }

  const workflowSteps = getOrderWorkflowSteps();
  const nextActions = getNextActions();

  return (
    <Box p={4}>
      {/* Header */}
      <Stack direction='row' alignItems='center' spacing={2} mb={3}>
        <IconButton onClick={handleBack}>
          <ArrowBack />
        </IconButton>
        <Typography variant='h4' fontWeight='bold'>
          Order Details
        </Typography>
        <Chip
          label={orderDetails.status}
          color={getStatusColor(orderDetails.status)}
          size='medium'
        />
        <Button variant='outlined' onClick={handleRefresh} size='small'>
          Refresh
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} lg={8}>
          {/* Order Summary - same as original */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Order Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant='body2' color='text.secondary'>
                    Order ID
                  </Typography>
                  <Typography variant='body1' fontWeight='bold'>
                    #{orderDetails.id.slice(-8)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant='body2' color='text.secondary'>
                    Total Amount
                  </Typography>
                  <Typography variant='h6' fontWeight='bold' color='primary'>
                    {formatCurrency(orderDetails.totalAmount)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant='body2' color='text.secondary'>
                    Total Items
                  </Typography>
                  <Typography variant='body1' fontWeight='bold'>
                    {orderDetails.totalQuantity} items
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant='body2' color='text.secondary'>
                    Order Date
                  </Typography>
                  <Typography variant='body1'>
                    {new Date(orderDetails.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Customer, Laundry, Items, Pickup/Delivery, Payment sections remain the same as original */}
          {/* ... (Keep all the existing sections from the original file) ... */}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* Quick Actions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Quick Actions
              </Typography>
              <Stack spacing={2}>
                {/* Add Notes */}
                <Button
                  variant='contained'
                  color='primary'
                  startIcon={<Edit />}
                  onClick={() => setNotesDialogOpen(true)}
                  fullWidth
                >
                  Add Notes
                </Button>

                {/* Cancel Order */}
                {orderDetails?.status !== 'CANCELLED' &&
                  orderDetails?.status !== 'COMPLETED' && (
                    <Button
                      variant='outlined'
                      color='error'
                      startIcon={<Cancel />}
                      onClick={() => setCancelDialogOpen(true)}
                    >
                      Cancel Order
                    </Button>
                  )}

                {/* Accept Order (PENDING → ACCEPTED) */}
                {orderDetails.status === 'PENDING' && (
                  <Button
                    variant='contained'
                    color='success'
                    startIcon={<CheckCircle />}
                    onClick={handleAcceptOrder}
                    disabled={acceptOrderMutation.isPending}
                    fullWidth
                  >
                    {acceptOrderMutation.isPending ? (
                      <CircularProgress size={20} color='inherit' />
                    ) : (
                      'Accept Order (Vendor)'
                    )}
                  </Button>
                )}

                {/* Dynamic Next Actions */}
                {nextActions.map((action, index) => (
                  <Button
                    key={index}
                    variant='contained'
                    color={action.color}
                    startIcon={action.icon}
                    onClick={action.handler}
                    fullWidth
                  >
                    {action.label}
                  </Button>
                ))}
              </Stack>
            </CardContent>
          </Card>

          {/* Order Timeline - same as original */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Order Progress
              </Typography>
              <Stepper orientation='vertical'>
                {workflowSteps.map((step, index) => (
                  <Step key={index} active={step.completed}>
                    <StepLabel
                      icon={
                        step.completed ? (
                          <CheckCircle color='success' />
                        ) : (
                          <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                            {index + 1}
                          </Avatar>
                        )
                      }
                    >
                      <Typography variant='body2' fontWeight='bold'>
                        {step.label}
                      </Typography>
                    </StepLabel>
                    <StepContent>
                      <Typography variant='caption' color='text.secondary'>
                        {step.description}
                      </Typography>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>

          {/* Order Statistics - same as original */}
        </Grid>
      </Grid>

      {/* Notes Dialog */}
      <Dialog
        open={notesDialogOpen}
        onClose={() => setNotesDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Add Admin Notes</DialogTitle>
        <DialogContent>
          <TextField
            label='Admin Notes'
            multiline
            rows={4}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
            placeholder='Add any notes about this order...'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotesDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveNotes}
            variant='contained'
            disabled={addNotesMutation.isPending || !adminNotes.trim()}
          >
            {addNotesMutation.isPending ? (
              <CircularProgress size={20} />
            ) : (
              'Save Notes'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Cancel Order</DialogTitle>
        <DialogContent>
          <Alert severity='warning' sx={{ mb: 2 }}>
            This action will cancel the order. The customer will be notified.
          </Alert>

          <TextField
            label='Cancellation Reason'
            multiline
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2 }}
            placeholder='Enter reason for cancellation...'
          />

          {orderDetails?.paid && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={refundCustomer}
                  onChange={(e) => setRefundCustomer(e.target.checked)}
                />
              }
              label='Refund customer payment'
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCancelOrder}
            variant='contained'
            color='error'
            disabled={cancelMutation.isPending || !cancelReason.trim()}
          >
            {cancelMutation.isPending ? (
              <CircularProgress size={20} />
            ) : (
              'Confirm Cancellation'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderDetails;
