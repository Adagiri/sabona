import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api-service';
import { toast } from 'react-toastify';
import { CUSTOM_ORDER_QUERIES } from '../query/customOrders';
import { FETCH_ORDER_QUERIES } from '../query';

// Types
interface UpdatePricingRequest {
  adminServiceCharge: number;
  totalAmount: number;
  estimatedVendorCost?: number;
  notes?: string;
}

interface AssignDriverRequest {
  riderId: string;
  notes?: string;
}

interface UploadReceiptRequest {
  vendorName: string;
  amountPaid: number;
  paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_PAYMENT';
  notes?: string;
  receiptFile: File;
}

// Update custom order pricing
export const useUpdateCustomOrderPricing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      data,
    }: {
      orderId: string;
      data: UpdatePricingRequest;
    }) => {
      const response = await api.patch(
        `/admin/custom-order/${orderId}/pricing`,
        data
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      console.log(typeof data);

      queryClient.invalidateQueries({
        queryKey: [
          CUSTOM_ORDER_QUERIES.FETCH_CUSTOM_ORDER_DETAILS,
          variables.orderId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [CUSTOM_ORDER_QUERIES.FETCH_CUSTOM_ORDER_STATS],
      });
      toast.success('Pricing updated successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to update pricing';
      toast.error(message);
    },
  });
};

// Assign driver to custom order
export const useAssignDriverToCustomOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      data,
    }: {
      orderId: string;
      data: AssignDriverRequest;
    }) => {
      const response = await api.post(
        `/admin/custom-order/${orderId}/assign-driver`,
        data
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      console.log(typeof data);

      queryClient.invalidateQueries({
        queryKey: [
          CUSTOM_ORDER_QUERIES.FETCH_CUSTOM_ORDER_DETAILS,
          variables.orderId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          CUSTOM_ORDER_QUERIES.FETCH_AVAILABLE_DRIVERS,
          variables.orderId,
        ],
      });
      toast.success('Driver assigned successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to assign driver';
      toast.error(message);
    },
  });
};

// Upload receipt for custom order
export const useUploadCustomOrderReceipt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      data,
    }: {
      orderId: string;
      data: UploadReceiptRequest;
    }) => {
      const formData = new FormData();
      formData.append('vendorName', data.vendorName);
      formData.append('amountPaid', data.amountPaid.toString());
      formData.append('paymentMethod', data.paymentMethod);
      if (data.notes) formData.append('notes', data.notes);
      formData.append('receiptImage', data.receiptFile);

      const response = await api.post(
        `/admin/custom-order/${orderId}/upload-receipt`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      console.log(typeof data);

      queryClient.invalidateQueries({
        queryKey: [
          CUSTOM_ORDER_QUERIES.FETCH_CUSTOM_ORDER_DETAILS,
          variables.orderId,
        ],
      });
      toast.success('Receipt uploaded successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to upload receipt';
      toast.error(message);
    },
  });
};

// Send PayTabs invoice to customer
export const useSendCustomOrderInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await api.post(
        `/admin/custom-order/${orderId}/send-invoice`
      );
      return response.data;
    },
    onSuccess: (data, orderId) => {
      console.log(typeof data);

      queryClient.invalidateQueries({
        queryKey: [CUSTOM_ORDER_QUERIES.FETCH_CUSTOM_ORDER_DETAILS, orderId],
      });
      toast.success('Invoice sent to customer successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to send invoice';
      toast.error(message);
    },
  });
};

// Mark custom order as ready for delivery
export const useMarkCustomOrderReady = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      deliveryRiderId,
    }: {
      orderId: string;
      deliveryRiderId?: string;
    }) => {
      const response = await api.patch(
        `/admin/custom-order/${orderId}/mark-ready`,
        {
          deliveryRiderId,
        }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      console.log(typeof data)
      queryClient.invalidateQueries({
        queryKey: [
          CUSTOM_ORDER_QUERIES.FETCH_CUSTOM_ORDER_DETAILS,
          variables.orderId,
        ],
      });
      toast.success('Order marked as ready for delivery');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to mark order as ready';
      toast.error(message);
    },
  });
};

// Update custom order notes
export const useUpdateCustomOrderNotes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      notes,
    }: {
      orderId: string;
      notes: string;
    }) => {
      const response = await api.patch(`/admin/custom-order/${orderId}/notes`, {
        notes,
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      console.log(typeof data)
      queryClient.invalidateQueries({
        queryKey: [
          CUSTOM_ORDER_QUERIES.FETCH_CUSTOM_ORDER_DETAILS,
          variables.orderId,
        ],
      });
      toast.success('Notes updated successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to update notes';
      toast.error(message);
    },
  });
};

// Regenerate payment link for custom order
export const useRegeneratePaymentLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await api.post(
        `/admin/custom-order/${orderId}/regenerate-payment-link`
      );
      return response.data;
    },
    onSuccess: (data, orderId) => {
      console.log(typeof data);
      queryClient.invalidateQueries({
        queryKey: [CUSTOM_ORDER_QUERIES.FETCH_CUSTOM_ORDER_DETAILS, orderId],
      });
      toast.success('Payment link regenerated successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to regenerate payment link';
      toast.error(message);
    },
  });
};

// Cancel custom order
export const useCancelCustomOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      reason,
      refundCustomer,
    }: {
      orderId: string;
      reason: string;
      refundCustomer?: boolean;
    }) => {
      const response = await api.patch(
        `/admin/custom-order/${orderId}/cancel`,
        {
          reason,
          refundCustomer,
        }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      console.log(typeof data)
      queryClient.invalidateQueries({
        queryKey: [
          CUSTOM_ORDER_QUERIES.FETCH_CUSTOM_ORDER_DETAILS,
          variables.orderId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [CUSTOM_ORDER_QUERIES.FETCH_CUSTOM_ORDER_STATS],
      });
      toast.success('Order cancelled successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to cancel order';
      toast.error(message);
    },
  });
};


export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      reason,
      refundCustomer,
    }: {
      orderId: string;
      reason: string;
      refundCustomer?: boolean;
    }) => {
      const response = await api.patch(`/admin/order/${orderId}/cancel`, {
        reason,
        refundCustomer,
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      console.log(typeof data)
      queryClient.invalidateQueries({
        queryKey: [FETCH_ORDER_QUERIES.FETCH_ORDER_DETAILS, variables.orderId],
      });
      queryClient.invalidateQueries({
        queryKey: [FETCH_ORDER_QUERIES.FETCH_ALL_ORDERS],
      });
      toast.success('Order cancelled successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to cancel order';
      toast.error(message);
    },
  });
};

// Accept order on behalf of vendor
export const useAcceptOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await api.patch(`/admin/order/${orderId}/accept`);
      return response.data;
    },
    onSuccess: (data, orderId) => {
      console.log(typeof data)
      queryClient.invalidateQueries({
        queryKey: [FETCH_ORDER_QUERIES.FETCH_ORDER_DETAILS, orderId],
      });
      queryClient.invalidateQueries({
        queryKey: [FETCH_ORDER_QUERIES.FETCH_ALL_ORDERS],
      });
      toast.success('Order accepted successfully. Driver has been assigned.');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to accept order';
      toast.error(message);
    },
  });
};