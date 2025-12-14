import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api-service';
import { toast } from 'react-toastify';
import { FETCH_ORDER_QUERIES } from '../query';

/**
 * Admin Order Management Mutations
 *
 * These mutations allow admin to perform actions on behalf of vendors and drivers
 * to manage the complete order flow.
 */

// ============================================================================
// DRIVER PICKUP ACTIONS (on behalf of pickup driver)
// ============================================================================

/**
 * Accept pickup ride on behalf of driver
 * Endpoint: PATCH /admin/order/:orderId/driver-accept-pickup
 */
export const useAcceptPickupRide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await api.patch(
        `/admin/order/${orderId}/driver-accept-pickup`
      );
      return response.data;
    },
    onSuccess: (data, orderId) => {
      queryClient.invalidateQueries({
        queryKey: [FETCH_ORDER_QUERIES.FETCH_ORDER_DETAILS, orderId],
      });
      queryClient.invalidateQueries({
        queryKey: [FETCH_ORDER_QUERIES.FETCH_ALL_ORDERS],
      });
      toast.success('Pickup ride accepted on behalf of driver');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to accept pickup ride';
      toast.error(message);
    },
  });
};

/**
 * Mark order as picked up from customer on behalf of driver
 * Endpoint: PATCH /admin/order/:orderId/driver-picked-up
 */
export const useMarkPickedUp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await api.patch(
        `/admin/order/${orderId}/driver-picked-up`
      );
      return response.data;
    },
    onSuccess: (data, orderId) => {
      queryClient.invalidateQueries({
        queryKey: [FETCH_ORDER_QUERIES.FETCH_ORDER_DETAILS, orderId],
      });
      queryClient.invalidateQueries({
        queryKey: [FETCH_ORDER_QUERIES.FETCH_ALL_ORDERS],
      });
      toast.success('Order marked as picked up from customer');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Failed to mark order as picked up';
      toast.error(message);
    },
  });
};

/**
 * Mark items dropped off at vendor on behalf of driver (triggers IN_PROGRESS)
 * Endpoint: PATCH /admin/order/:orderId/driver-dropped-at-vendor
 */
export const useMarkDroppedAtVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await api.patch(
        `/admin/order/${orderId}/driver-dropped-at-vendor`
      );
      return response.data;
    },
    onSuccess: (data, orderId) => {
      queryClient.invalidateQueries({
        queryKey: [FETCH_ORDER_QUERIES.FETCH_ORDER_DETAILS, orderId],
      });
      queryClient.invalidateQueries({
        queryKey: [FETCH_ORDER_QUERIES.FETCH_ALL_ORDERS],
      });
      toast.success(
        'Items marked as dropped at vendor. Order status updated to IN_PROGRESS.'
      );
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Failed to mark items as dropped at vendor';
      toast.error(message);
    },
  });
};

// ============================================================================
// VENDOR ACTIONS (on behalf of vendor)
// ============================================================================

/**
 * Mark order ready for delivery on behalf of vendor (triggers READY_FOR_PICKUP)
 * Endpoint: PATCH /admin/order/:orderId/mark-ready
 */
export const useMarkReadyForDelivery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await api.patch(`/admin/order/${orderId}/mark-ready`);
      return response.data;
    },
    onSuccess: (data, orderId) => {
      queryClient.invalidateQueries({
        queryKey: [FETCH_ORDER_QUERIES.FETCH_ORDER_DETAILS, orderId],
      });
      queryClient.invalidateQueries({
        queryKey: [FETCH_ORDER_QUERIES.FETCH_ALL_ORDERS],
      });
      toast.success(
        'Order marked as ready for delivery on behalf of vendor'
      );
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Failed to mark order as ready for delivery';
      toast.error(message);
    },
  });
};

// ============================================================================
// DRIVER DELIVERY ACTIONS (on behalf of delivery driver)
// ============================================================================

/**
 * Accept delivery ride on behalf of driver
 * Endpoint: PATCH /admin/order/:orderId/driver-accept-delivery
 */
export const useAcceptDeliveryRide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await api.patch(
        `/admin/order/${orderId}/driver-accept-delivery`
      );
      return response.data;
    },
    onSuccess: (data, orderId) => {
      queryClient.invalidateQueries({
        queryKey: [FETCH_ORDER_QUERIES.FETCH_ORDER_DETAILS, orderId],
      });
      queryClient.invalidateQueries({
        queryKey: [FETCH_ORDER_QUERIES.FETCH_ALL_ORDERS],
      });
      toast.success('Delivery ride accepted on behalf of driver');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Failed to accept delivery ride';
      toast.error(message);
    },
  });
};

/**
 * Mark order as delivered to customer on behalf of driver (triggers COMPLETED)
 * Endpoint: PATCH /admin/order/:orderId/driver-delivered
 */
export const useMarkDelivered = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await api.patch(
        `/admin/order/${orderId}/driver-delivered`
      );
      return response.data;
    },
    onSuccess: (data, orderId) => {
      queryClient.invalidateQueries({
        queryKey: [FETCH_ORDER_QUERIES.FETCH_ORDER_DETAILS, orderId],
      });
      queryClient.invalidateQueries({
        queryKey: [FETCH_ORDER_QUERIES.FETCH_ALL_ORDERS],
      });
      toast.success('Order marked as delivered. Status updated to COMPLETED.');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        'Failed to mark order as delivered';
      toast.error(message);
    },
  });
};

// ============================================================================
// ADMIN NOTES
// ============================================================================

/**
 * Add admin notes to order
 * Endpoint: PATCH /admin/order/:orderId/notes
 */
export const useAddOrderNotes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      notes,
    }: {
      orderId: string;
      notes: string;
    }) => {
      const response = await api.patch(`/admin/order/${orderId}/notes`, {
        notes,
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          FETCH_ORDER_QUERIES.FETCH_ORDER_DETAILS,
          variables.orderId,
        ],
      });
      toast.success('Admin notes added successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to add admin notes';
      toast.error(message);
    },
  });
};
