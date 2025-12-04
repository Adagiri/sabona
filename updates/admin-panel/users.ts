import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api-service';
import { toast } from 'react-toastify';
import { FETCH_USER_QUERIES } from '../query';

// Types
export interface EditUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'REJECTED';
  level?: 'BASIC' | 'LOYAL' | 'ELITE';
}

export interface ChangePhoneRequest {
  newPhone: string;
  reason: string;
}

export interface ChangeEmailRequest {
  newEmail: string;
  reason?: string;
}

export interface EditUserResponse {
  data: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    status: string;
    level: string | null;
    type: string;
    updatedAt: string;
  };
  message: string;
  changesApplied?: string[];
}

// Edit user profile
export const useEditUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: string;
      data: EditUserRequest;
    }) => {
      const response = await api.patch<EditUserResponse>(
        `/admin/users/${userId}/edit`,
        data
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate user queries to refresh data
      queryClient.invalidateQueries({
        queryKey: [FETCH_USER_QUERIES.FETCH_USER_BY_ID, variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: [FETCH_USER_QUERIES.FETCH_ALL_USERS],
      });

      const changesApplied = data.changesApplied?.join(', ') || 'profile';
      toast.success(`User ${changesApplied} updated successfully`);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to update user';
      toast.error(message);
    },
  });
};

// Change user phone
export const useChangeUserPhone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: string;
      data: ChangePhoneRequest;
    }) => {
      const response = await api.post(
        `/admin/users/${userId}/change-phone`,
        data
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [FETCH_USER_QUERIES.FETCH_USER_BY_ID, variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: [FETCH_USER_QUERIES.FETCH_ALL_USERS],
      });
      toast.success('Phone number updated successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to change phone number';
      toast.error(message);
    },
  });
};

// Change user email
export const useChangeUserEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: string;
      data: ChangeEmailRequest;
    }) => {
      const response = await api.post(
        `/admin/users/${userId}/change-email`,
        data
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [FETCH_USER_QUERIES.FETCH_USER_BY_ID, variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: [FETCH_USER_QUERIES.FETCH_ALL_USERS],
      });
      toast.success('Email updated successfully');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to change email';
      toast.error(message);
    },
  });
};
