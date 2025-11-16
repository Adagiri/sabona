// Single-Item Order Change Hooks

export const useChangeLaundryServiceOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      laundryId,
      serviceId,
      newPosition,
    }: {
      laundryId: string;
      serviceId: string;
      newPosition: number;
    }) => {
      const response = await api.patch(
        `/admin/laundry/${laundryId}/service/${serviceId}/change-order`,
        { newPosition }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['laundry-services', variables.laundryId],
      });
    },
  });
};

export const useChangeLaundryServiceItemOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      laundryId,
      serviceId,
      categoryId,
      itemId,
      newPosition,
    }: {
      laundryId: string;
      serviceId: string;
      categoryId: string;
      itemId: string;
      newPosition: number;
    }) => {
      const response = await api.patch(
        `/admin/laundry/${laundryId}/service/${serviceId}/category/${categoryId}/item/${itemId}/change-order`,
        { newPosition }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          'laundry-service-items',
          variables.laundryId,
          variables.serviceId,
        ],
      });
    },
  });
};
