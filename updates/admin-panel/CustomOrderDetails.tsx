import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  TextField,
} from '@mui/material';
import {
  LocationOn,
  Person,
  Phone,
  Email,
  Assignment,
  Receipt,
  Money,
  LocalShipping,
  Edit,
  Upload,
  ContentCopy,
  OpenInNew,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useFetchCustomOrderById } from '../hooks/Admin/customOrdersHooks';
import CustomOrderDetailsDialog from '../components/CustomOrderDetailsDialog';
import DriverAssignmentDialog from '../components/DriverAssignmentDialog';
import ReceiptUploadDialog from '../components/ReceiptUploadDialog';
import { useState } from 'react';
import DeliveryDriverAssignmentDialog from '../components/DeliveryDriverAssignmentDialog';
import { toast } from 'react-toastify';
import { Cancel } from '@mui/icons-material';
import {
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useCancelCustomOrder, useRegeneratePaymentLink } from '../hooks/Admin/mutations/customOrders';
import { Refresh } from '@mui/icons-material';

const CustomOrderDetails = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [driverDialogOpen, setDriverDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [deliveryDriverDialogOpen, setDeliveryDriverDialogOpen] =
    useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [refundCustomer, setRefundCustomer] = useState(false);
  const cancelMutation = useCancelCustomOrder();
  const regeneratePaymentLinkMutation = useRegeneratePaymentLink();

  const {
    data: order,
    isLoading,
    isError,
  } = useFetchCustomOrderById(orderId || '');

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

  // Check if payment link can be regenerated
  const canRegeneratePaymentLink = () => {
    if (!order?.payTabsInvoiceDateCreated || order.customerPaid) {
      return false;
    }

    const now = new Date();
    const linkCreatedAt = new Date(order.payTabsInvoiceDateCreated);
    const timeDifferenceInMinutes = (now.getTime() - linkCreatedAt.getTime()) / (1000 * 60);

    return timeDifferenceInMinutes >= 20;
  };

  // Get remaining time until regeneration is allowed
  const getRemainingTime = () => {
    if (!order?.payTabsInvoiceDateCreated) {
      return 0;
    }

    const now = new Date();
    const linkCreatedAt = new Date(order.payTabsInvoiceDateCreated);
    const timeDifferenceInMinutes = (now.getTime() - linkCreatedAt.getTime()) / (1000 * 60);
    const remainingMinutes = Math.max(0, Math.ceil(20 - timeDifferenceInMinutes));

    return remainingMinutes;
  };

  const handleRegeneratePaymentLink = async () => {
    if (!canRegeneratePaymentLink()) {
      const remainingMinutes = getRemainingTime();
      toast.error(
        `Payment link can only be regenerated after 20 minutes. Please wait ${remainingMinutes} more minute(s)`
      );
      return;
    }

    try {
      await regeneratePaymentLinkMutation.mutateAsync(orderId!);
    } catch (error) {
      console.error('Failed to regenerate payment link:', error);
    }
  };

  if (isLoading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        height='50vh'
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !order) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        height='50vh'
        flexDirection='column'
      >
        <Alert severity='error' sx={{ mb: 2 }}>
          Failed to load custom order details
        </Alert>
        <Button variant='contained' onClick={() => navigate('/custom-orders')}>
          Back to Custom Orders
        </Button>
      </Box>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      case 'IN_PROGRESS':
        return 'warning';
      case 'PENDING':
        return 'default';
      default:
        return 'primary';
    }
  };

  const getNextAction = () => {
    switch (order.status) {
      case 'PENDING':
        return 'Assign Pickup Driver';
      case 'IN_PROGRESS':
        if (!order.customVendorPaid) return 'Upload Receipt';
        if (!order.customerPaid) return 'Awaiting Payment';
        return 'Assign Delivery Driver';
      case 'READY_FOR_PICKUP':
        return 'In Transit';
      default:
        return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', mx: 'auto' }}>
      {/* Header */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={3}
      >
        <Box>
          <Typography variant='h4' gutterBottom>
            Custom Order #{order.id.slice(-8)}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Custom Laundry Order - Management Dashboard
          </Typography>
        </Box>
        <Button variant='outlined' onClick={() => navigate('/custom-orders')}>
          Back to Custom Orders
        </Button>
      </Box>

      {/* Action Bar */}
      {nextAction && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'warning.light' }}>
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='center'
          >
            <Typography variant='body1' fontWeight='medium'>
              Next Action Required: {nextAction}
            </Typography>
            <Stack direction='row' spacing={1}>
              {nextAction === 'Assign Pickup Driver' && (
                <Button
                  variant='contained'
                  startIcon={<Assignment />}
                  onClick={() => setDriverDialogOpen(true)}
                >
                  Assign Driver
                </Button>
              )}
              {nextAction === 'Upload Receipt' && (
                <Button
                  variant='contained'
                  startIcon={<Upload />}
                  onClick={() => setReceiptDialogOpen(true)}
                >
                  Upload Receipt
                </Button>
              )}
              {nextAction === 'Assign Delivery Driver' && (
                <Button
                  variant='contained'
                  startIcon={<LocalShipping />}
                  onClick={() => setDeliveryDriverDialogOpen(true)}
                >
                  Assign Delivery Driver
                </Button>
              )}
            </Stack>
          </Box>
        </Paper>
      )}

      <Grid container spacing={3}>
        {/* Order Status */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant='h6' gutterBottom>
              Order Status & Management
            </Typography>
            <Box display='flex' alignItems='center' gap={2} mb={2}>
              <Chip
                label={order.status}
                color={getStatusColor(order.status)}
                // size='large'
                sx={{ fontSize: '1rem', px: 2, py: 1 }}
              />
              <Chip
                label='Custom Order'
                color='secondary'
                size='small'
                variant='outlined'
              />
              <Typography variant='body2' color='text.secondary'>
                Created: {new Date(order.createdAt).toLocaleString()}
              </Typography>
            </Box>

            {/* Management Actions */}
            <Stack direction='row' spacing={2}>
              <Button
                startIcon={<Edit />}
                onClick={() => setDetailsDialogOpen(true)}
                variant='outlined'
                size='small'
              >
                Edit Details
              </Button>

              <Button
                startIcon={<Assignment />}
                onClick={() => setDriverDialogOpen(true)}
                variant='outlined'
                size='small'
              >
                Assign Drivers
              </Button>
              <Button
                startIcon={<Receipt />}
                onClick={() => setReceiptDialogOpen(true)}
                variant='outlined'
                size='small'
              >
                Manage Receipt
              </Button>

              {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                <Button
                  startIcon={<Cancel />}
                  onClick={() => setCancelDialogOpen(true)}
                  variant='outlined'
                  color='error'
                  size='small'
                >
                  Cancel Order
                </Button>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Customer Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography
              variant='h6'
              gutterBottom
              display='flex'
              alignItems='center'
              gap={1}
            >
              <Person /> Customer Information
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant='body1' fontWeight='medium'>
                {order.customer?.firstName} {order.customer?.lastName}
              </Typography>
              <Box display='flex' alignItems='center' gap={1} mt={1}>
                <Phone fontSize='small' color='action' />
                <Typography variant='body2'>{order.customer?.phone}</Typography>
              </Box>
              {order.customer?.email && (
                <Box display='flex' alignItems='center' gap={1} mt={1}>
                  <Email fontSize='small' color='action' />
                  <Typography variant='body2'>
                    {order.customer?.email}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Custom Laundry Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography
              variant='h6'
              gutterBottom
              display='flex'
              alignItems='center'
              gap={1}
            >
              <LocationOn /> Custom Laundry Location
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant='body1' fontWeight='medium'>
                {order.customLaundryName}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                {order.customLaundryDescription}
              </Typography>
              {order.customLaundryAddress && (
                <Box display='flex' alignItems='center' gap={1} mt={1}>
                  <LocationOn fontSize='small' color='action' />
                  <Typography variant='body2'>
                    {order.customLaundryAddress}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Pricing Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography
              variant='h6'
              gutterBottom
              display='flex'
              alignItems='center'
              gap={1}
            >
              <Money /> Pricing Details
            </Typography>
            <Box sx={{ mt: 2 }}>
              {order.adminServiceCharge ? (
                <>
                  <Box display='flex' justifyContent='space-between' mb={1}>
                    <Typography variant='body2'>Service Charge:</Typography>
                    <Typography variant='body2' fontWeight='medium'>
                      ${order.adminServiceCharge}
                    </Typography>
                  </Box>
                  <Box display='flex' justifyContent='space-between' mb={1}>
                    <Typography variant='body1' fontWeight='medium'>
                      Total Amount:
                    </Typography>
                    <Typography
                      variant='body1'
                      fontWeight='bold'
                      color='primary'
                    >
                      ${order.totalAmount}
                    </Typography>
                  </Box>
                  <Chip
                    label={
                      order.customerPaid
                        ? 'Payment Received'
                        : 'Awaiting Payment'
                    }
                    color={order.customerPaid ? 'success' : 'warning'}
                    size='small'
                    sx={{ mt: 1 }}
                  />
                </>
              ) : (
                <Alert severity='warning' sx={{ mt: 1 }}>
                  Pricing not set. Please set pricing to proceed.
                </Alert>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Vendor Payment Status */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography
              variant='h6'
              gutterBottom
              display='flex'
              alignItems='center'
              gap={1}
            >
              <Receipt /> Vendor Payment & Customer Invoice
            </Typography>
            <Box sx={{ mt: 2 }}>
              {order.customVendorPaid ? (
                <>
                  <Box display='flex' justifyContent='space-between' mb={1}>
                    <Typography variant='body2'>Vendor:</Typography>
                    <Typography variant='body2' fontWeight='medium'>
                      {order.customVendorName}
                    </Typography>
                  </Box>
                  <Box display='flex' justifyContent='space-between' mb={1}>
                    <Typography variant='body2'>
                      Amount Paid to Vendor:
                    </Typography>
                    <Typography variant='body2' fontWeight='medium'>
                      {order.customVendorPaid} SAR
                    </Typography>
                  </Box>
                  <Box display='flex' justifyContent='space-between' mb={1}>
                    <Typography variant='body2'>
                      Customer Invoice Amount:
                    </Typography>
                    <Typography
                      variant='body2'
                      fontWeight='medium'
                      color='primary.main'
                    >
                      {order.customVendorPaid} SAR
                    </Typography>
                  </Box>
                  <Box display='flex' justifyContent='space-between' mb={1}>
                    <Typography variant='body2'>Payment Method:</Typography>
                    <Typography variant='body2' fontWeight='medium'>
                      {order.customPaymentMethod}
                    </Typography>
                  </Box>
                  <Chip
                    label={
                      order.customerPaid
                        ? 'Customer Paid'
                        : 'Awaiting Customer Payment'
                    }
                    color={order.customerPaid ? 'success' : 'warning'}
                    size='small'
                    sx={{ mt: 1 }}
                  />
                </>
              ) : (
                <Alert severity='info'>
                  Driver payment receipt not uploaded yet. Upload receipt to
                  generate customer invoice.
                </Alert>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Payment Invoice Link */}
        {order.payTabsInvoiceUrl && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography
                variant='h6'
                gutterBottom
                display='flex'
                alignItems='center'
                gap={1}
              >
                <Receipt /> Customer Payment Invoice
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Alert
                  severity={order.customerPaid ? 'success' : 'warning'}
                  sx={{ mb: 2 }}
                >
                  <Typography variant='body2' fontWeight='bold'>
                    Payment Status:{' '}
                    {order.customerPaid ? 'Paid ✓' : 'Awaiting Payment'}
                  </Typography>
                  {order.customerPaymentDate && (
                    <Typography variant='caption' display='block'>
                      Paid on:{' '}
                      {new Date(order.customerPaymentDate).toLocaleString()}
                    </Typography>
                  )}
                </Alert>

                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'grey.300',
                  }}
                >
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Invoice Link (Share with customer):
                  </Typography>
                  <Box
                    display='flex'
                    gap={1}
                    alignItems='center'
                    sx={{ mt: 1 }}
                  >
                    <TextField
                      fullWidth
                      value={order.payTabsInvoiceUrl}
                      InputProps={{
                        readOnly: true,
                        sx: { fontFamily: 'monospace', fontSize: '0.875rem' },
                      }}
                      size='small'
                    />
                    <Button
                      variant='contained'
                      onClick={() => {
                        navigator.clipboard.writeText(order.payTabsInvoiceUrl);
                        toast.success('Invoice link copied to clipboard!');
                      }}
                      startIcon={<ContentCopy />}
                    >
                      Copy
                    </Button>
                    <Button
                      variant='outlined'
                      onClick={() =>
                        window.open(order.payTabsInvoiceUrl, '_blank')
                      }
                      startIcon={<OpenInNew />}
                    >
                      Open
                    </Button>
                  </Box>

                  {/* Regenerate Payment Link Button */}
                  {!order.customerPaid && (
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant='outlined'
                        color='warning'
                        onClick={handleRegeneratePaymentLink}
                        startIcon={<Refresh />}
                        disabled={
                          !canRegeneratePaymentLink() ||
                          regeneratePaymentLinkMutation.isPending
                        }
                        fullWidth
                      >
                        {regeneratePaymentLinkMutation.isPending ? (
                          <CircularProgress size={20} />
                        ) : canRegeneratePaymentLink() ? (
                          'Regenerate Payment Link'
                        ) : (
                          `Regenerate in ${getRemainingTime()} min`
                        )}
                      </Button>
                      {order.payTabsInvoiceDateCreated && (
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          display='block'
                          sx={{ mt: 1, textAlign: 'center' }}
                        >
                          Link created:{' '}
                          {new Date(
                            order.payTabsInvoiceDateCreated
                          ).toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>

                {!order.customerPaid && (
                  <Alert severity='info' sx={{ mt: 2 }}>
                    Share this link with the customer via WhatsApp, SMS, or any
                    messaging app. The customer must pay this invoice before
                    delivery can proceed.
                  </Alert>
                )}
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Driver Assignments */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography
              variant='h6'
              gutterBottom
              display='flex'
              alignItems='center'
              gap={1}
            >
              <LocalShipping /> Driver Assignments
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              {/* Pickup Driver */}
              <Grid item xs={12} md={6}>
                <Typography variant='subtitle1' gutterBottom>
                  Pickup Driver
                </Typography>
                {order.riderOrders?.find(
                  (ro: any) => ro.type === 'RIDER_PICKUP'
                ) ? (
                  <Box>
                    <Typography variant='body2' fontWeight='medium'>
                      {
                        order.riderOrders.find(
                          (ro: any) => ro.type === 'RIDER_PICKUP'
                        ).rider?.firstName
                      }{' '}
                      {
                        order.riderOrders.find(
                          (ro: any) => ro.type === 'RIDER_PICKUP'
                        ).rider?.lastName
                      }
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {
                        order.riderOrders.find(
                          (ro: any) => ro.type === 'RIDER_PICKUP'
                        ).rider?.phone
                      }
                    </Typography>
                    <Chip
                      label='Assigned'
                      color='success'
                      size='small'
                      sx={{ mt: 1 }}
                    />
                  </Box>
                ) : (
                  <Alert severity='warning' sx={{ mt: 1 }}>
                    No pickup driver assigned
                  </Alert>
                )}
              </Grid>

              {/* Delivery Driver */}
              <Grid item xs={12} md={6}>
                <Typography variant='subtitle1' gutterBottom>
                  Delivery Driver
                </Typography>
                {order.riderOrders?.find(
                  (ro: any) => ro.type === 'RIDER_DELIVERY'
                ) ? (
                  <Box>
                    <Typography variant='body2' fontWeight='medium'>
                      {
                        order.riderOrders.find(
                          (ro: any) => ro.type === 'RIDER_DELIVERY'
                        ).rider?.firstName
                      }{' '}
                      {
                        order.riderOrders.find(
                          (ro: any) => ro.type === 'RIDER_DELIVERY'
                        ).rider?.lastName
                      }
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {
                        order.riderOrders.find(
                          (ro: any) => ro.type === 'RIDER_DELIVERY'
                        ).rider?.phone
                      }
                    </Typography>
                    <Chip
                      label='Assigned'
                      color='success'
                      size='small'
                      sx={{ mt: 1 }}
                    />
                  </Box>
                ) : (
                  <Alert severity='info' sx={{ mt: 1 }}>
                    No delivery driver assigned yet
                  </Alert>
                )}
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Management Dialogs */}
      <CustomOrderDetailsDialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        order={order}
        // onUpdate={refetch}
      />

      <DriverAssignmentDialog
        open={driverDialogOpen}
        onClose={() => setDriverDialogOpen(false)}
        order={order}
        // onUpdate={refetch}
      />

      <ReceiptUploadDialog
        open={receiptDialogOpen}
        onClose={() => setReceiptDialogOpen(false)}
        order={order}
        // onUpdate={refetch}
      />

      <DeliveryDriverAssignmentDialog
        open={deliveryDriverDialogOpen}
        onClose={() => setDeliveryDriverDialogOpen(false)}
        order={order}
      />

      {/* Cancel Order Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        {/* Status-specific warnings */}
        {order.status === 'ACCEPTED' && (
          <Alert severity='warning' sx={{ mb: 2 }}>
            <Typography variant='subtitle2' gutterBottom>
              ⚠️ Order has been ACCEPTED
            </Typography>
            <Typography variant='body2'>
              The pickup driver has been assigned. Cancelling now may impact
              operations.
            </Typography>
          </Alert>
        )}

        {order.status === 'IN_PROGRESS' && (
          <Alert severity='error' sx={{ mb: 2 }}>
            <Typography variant='subtitle2' gutterBottom>
              ⚠️ Order is IN PROGRESS
            </Typography>
            <Typography variant='body2'>
              Work has already started. Receipt may have been uploaded. Ensure
              coordination with driver and vendor.
            </Typography>
          </Alert>
        )}

        {order.status === 'READY_FOR_PICKUP' && (
          <Alert severity='error' sx={{ mb: 2 }}>
            <Typography variant='subtitle2' gutterBottom>
              ⚠️ Order is READY FOR PICKUP
            </Typography>
            <Typography variant='body2'>
              Delivery driver may be assigned. Coordinate immediately before
              cancelling.
            </Typography>
          </Alert>
        )}

        <Alert severity='warning' sx={{ mb: 2 }}>
          This action will cancel the order. The customer will be notified.
        </Alert>
        <DialogTitle>Cancel Custom Order</DialogTitle>
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
            sx={{ mb: 2, mt: 1 }}
            placeholder='Enter reason for cancellation...'
          />

          {order.customerPaid && (
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

export default CustomOrderDetails;
