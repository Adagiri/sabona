import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  Alert,
  CircularProgress,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  Settings,
  Save,
  AttachMoney,
  LocalShipping,
  Receipt,
  SwapHoriz,
} from '@mui/icons-material';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import { useFetchAdminSettings } from '../hooks/Admin/query';
import {
  useUpdateAdminSettings,
  UpdateAdminSettingsRequest,
} from '../hooks/Admin/mutation';

const AdminSettings: React.FC = () => {
  const { data: settings, isLoading, error } = useFetchAdminSettings();
  const { mutateAsync: updateSettings, isPending: isUpdating } =
    useUpdateAdminSettings();

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<UpdateAdminSettingsRequest>({
    defaultValues: {
      vatRate: 0.15,
      vatEnabled: true,
      serviceChargeType: 'PERCENTAGE',
      serviceChargeRate: 7.0,
      customOrderServiceChargeRate: 10.0,
      deliveryBaseRate: 5.0,
      deliveryPerKmRate: 2.0,
      freeDeliveryThreshold: 100.0,
      expressMultiplier: 2.0,
      maxDeliveryDistance: 50.0,
      transferChargeType: 'PERCENTAGE',
      transferChargeRate: 1.0,
    },
  });

  // Watch charge types for dynamic input labels
  const serviceChargeType = useWatch({
    control,
    name: 'serviceChargeType',
    defaultValue: 'PERCENTAGE',
  });

  const transferChargeType = useWatch({
    control,
    name: 'transferChargeType',
    defaultValue: 'PERCENTAGE',
  });

  // Update form when settings are loaded
  React.useEffect(() => {
    if (settings?.data) {
      reset({
        vatRate: settings.data.vatRate,
        vatEnabled: settings.data.vatEnabled,
        serviceChargeType: settings.data.serviceChargeType,
        serviceChargeRate: settings.data.serviceChargeRate,
        customOrderServiceChargeRate: settings.data.customOrderServiceChargeRate,
        deliveryBaseRate: settings.data.deliveryBaseRate,
        deliveryPerKmRate: settings.data.deliveryPerKmRate,
        freeDeliveryThreshold: settings.data.freeDeliveryThreshold,
        expressMultiplier: settings.data.expressMultiplier,
        maxDeliveryDistance: settings.data.maxDeliveryDistance,
        transferChargeType: settings.data.transferChargeType || 'PERCENTAGE',
        transferChargeRate: settings.data.transferChargeRate || 1.0,
      });
    }
  }, [settings, reset]);

  const onSubmit = async (data: UpdateAdminSettingsRequest) => {
    try {
      await updateSettings(data);
      toast.success('Admin settings updated successfully');
    } catch (error) {
      toast.error('Failed to update admin settings');
      console.error('Error updating admin settings:', error);
    }
  };

  if (isLoading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' height='400px'>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity='error' sx={{ m: 2 }}>
        Failed to load admin settings. Please try refreshing the page.
      </Alert>
    );
  }

  return (
    <Box p={3}>
      <ToastContainer />

      <Box mb={3}>
        <Typography variant='h4' component='h1' gutterBottom>
          <Settings sx={{ mr: 2, verticalAlign: 'middle' }} />
          Admin Settings
        </Typography>
        <Typography variant='subtitle1' color='text.secondary'>
          Manage pricing, fees, and business configuration
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* VAT Configuration */}
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  <Receipt sx={{ mr: 1, verticalAlign: 'middle' }} />
                  VAT Configuration
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name='vatEnabled'
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Switch {...field} checked={field.value} color='primary' />}
                          label='Enable VAT'
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name='vatRate'
                      control={control}
                      rules={{
                        required: 'VAT rate is required',
                        min: { value: 0, message: 'VAT rate must be positive' },
                        max: { value: 1, message: 'VAT rate must be ≤ 100%' },
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label='VAT Rate'
                          type='number'
                          inputProps={{ step: 0.01, min: 0, max: 1 }}
                          InputProps={{
                            endAdornment: <InputAdornment position='end'>%</InputAdornment>,
                          }}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          error={!!errors.vatRate}
                          helperText={errors.vatRate?.message || 'Enter as decimal (0.15 = 15%)'}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Service Charge Configuration */}
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  <AttachMoney sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Service Charges
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Controller
                      name='serviceChargeType'
                      control={control}
                      render={({ field }) => (
                        <FormControl>
                          <FormLabel>Service Charge Type</FormLabel>
                          <RadioGroup {...field} row>
                            <FormControlLabel value='PERCENTAGE' control={<Radio />} label='Percentage' />
                            <FormControlLabel value='FIXED' control={<Radio />} label='Fixed Amount' />
                          </RadioGroup>
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name='serviceChargeRate'
                      control={control}
                      rules={{
                        required: 'Service charge rate is required',
                        min: { value: 0, message: 'Rate must be positive' },
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label='Regular Service Charge'
                          type='number'
                          inputProps={{ step: 0.01, min: 0 }}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position='end'>
                                {serviceChargeType === 'PERCENTAGE' ? '%' : 'SAR'}
                              </InputAdornment>
                            ),
                          }}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          error={!!errors.serviceChargeRate}
                          helperText={errors.serviceChargeRate?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name='customOrderServiceChargeRate'
                      control={control}
                      rules={{
                        required: 'Custom order service charge is required',
                        min: { value: 0, message: 'Rate must be positive' },
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label='Custom Order Service Charge'
                          type='number'
                          inputProps={{ step: 0.01, min: 0 }}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position='end'>
                                {serviceChargeType === 'PERCENTAGE' ? '%' : 'SAR'}
                              </InputAdornment>
                            ),
                          }}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          error={!!errors.customOrderServiceChargeRate}
                          helperText={errors.customOrderServiceChargeRate?.message}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Transfer Charge Configuration */}
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  <SwapHoriz sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Transfer Charges (Withdrawal Fee)
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Controller
                      name='transferChargeType'
                      control={control}
                      render={({ field }) => (
                        <FormControl>
                          <FormLabel>Transfer Charge Type</FormLabel>
                          <RadioGroup {...field} row>
                            <FormControlLabel value='PERCENTAGE' control={<Radio />} label='Percentage' />
                            <FormControlLabel value='FIXED' control={<Radio />} label='Fixed Amount' />
                          </RadioGroup>
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name='transferChargeRate'
                      control={control}
                      rules={{
                        required: 'Transfer charge rate is required',
                        min: { value: 0, message: 'Rate must be positive' },
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label='Transfer Charge Rate'
                          type='number'
                          inputProps={{ step: 0.01, min: 0 }}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position='end'>
                                {transferChargeType === 'PERCENTAGE' ? '%' : 'SAR'}
                              </InputAdornment>
                            ),
                          }}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          error={!!errors.transferChargeRate}
                          helperText={
                            errors.transferChargeRate?.message ||
                            'Fee deducted from vendor earnings during withdrawal'
                          }
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Delivery Configuration */}
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  <LocalShipping sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Delivery Settings
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name='deliveryBaseRate'
                      control={control}
                      rules={{
                        required: 'Base delivery rate is required',
                        min: { value: 0, message: 'Rate must be positive' },
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label='Base Delivery Rate'
                          type='number'
                          inputProps={{ step: 0.01, min: 0 }}
                          InputProps={{
                            endAdornment: <InputAdornment position='end'>SAR</InputAdornment>,
                          }}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          error={!!errors.deliveryBaseRate}
                          helperText={errors.deliveryBaseRate?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                      name='deliveryPerKmRate'
                      control={control}
                      rules={{
                        required: 'Per km rate is required',
                        min: { value: 0, message: 'Rate must be positive' },
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label='Rate Per Kilometer'
                          type='number'
                          inputProps={{ step: 0.01, min: 0 }}
                          InputProps={{
                            endAdornment: <InputAdornment position='end'>SAR/km</InputAdornment>,
                          }}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          error={!!errors.deliveryPerKmRate}
                          helperText={errors.deliveryPerKmRate?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                      name='maxDeliveryDistance'
                      control={control}
                      rules={{
                        required: 'Max delivery distance is required',
                        min: { value: 1, message: 'Distance must be positive' },
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label='Max Delivery Distance'
                          type='number'
                          inputProps={{ step: 0.1, min: 0 }}
                          InputProps={{
                            endAdornment: <InputAdornment position='end'>km</InputAdornment>,
                          }}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          error={!!errors.maxDeliveryDistance}
                          helperText={errors.maxDeliveryDistance?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name='freeDeliveryThreshold'
                      control={control}
                      rules={{
                        required: 'Free delivery threshold is required',
                        min: { value: 0, message: 'Threshold must be positive' },
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label='Free Delivery Threshold'
                          type='number'
                          inputProps={{ step: 0.01, min: 0 }}
                          InputProps={{
                            endAdornment: <InputAdornment position='end'>SAR</InputAdornment>,
                          }}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          error={!!errors.freeDeliveryThreshold}
                          helperText={
                            errors.freeDeliveryThreshold?.message ||
                            'Orders above this amount get free delivery'
                          }
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name='expressMultiplier'
                      control={control}
                      rules={{
                        required: 'Express multiplier is required',
                        min: { value: 1, message: 'Multiplier must be ≥ 1' },
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label='Express Delivery Multiplier'
                          type='number'
                          inputProps={{ step: 0.1, min: 1 }}
                          InputProps={{
                            endAdornment: <InputAdornment position='end'>x</InputAdornment>,
                          }}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                          error={!!errors.expressMultiplier}
                          helperText={
                            errors.expressMultiplier?.message || 'Express delivery cost multiplier'
                          }
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardContent>
                <Box display='flex' justifyContent='space-between' alignItems='center'>
                  <Typography variant='body2' color='text.secondary'>
                    {isDirty ? 'You have unsaved changes' : 'All changes saved'}
                  </Typography>

                  <Box display='flex' gap={2}>
                    <Button variant='outlined' onClick={() => reset()} disabled={!isDirty || isUpdating}>
                      Reset
                    </Button>

                    <Button
                      type='submit'
                      variant='contained'
                      disabled={!isDirty || isUpdating}
                      startIcon={isUpdating ? <CircularProgress size={20} /> : <Save />}
                    >
                      {isUpdating ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Fee Calculation Info */}
          <Grid item xs={12}>
            <Alert severity='info' sx={{ mb: 1 }}>
              <Typography variant='subtitle2' gutterBottom>
                <strong>Fee Calculation Order:</strong>
              </Typography>
              <Typography variant='body2'>
                1. Service charge is added to subtotal
                <br />
                2. Delivery fee is calculated based on distance
                <br />
                3. VAT is applied to (subtotal + service charge + delivery fee)
                <br />
                4. Express delivery multiplies the delivery fee only
                <br />
                5. Transfer charge is deducted from vendor earnings during withdrawal
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default AdminSettings;
