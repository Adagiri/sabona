import {
  Box,
  Typography,
  Pagination,
  CircularProgress,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
} from '@mui/material';
import { Visibility, Edit } from '@mui/icons-material';
import { useFetchAllUsers } from '../hooks/Admin/query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Filter, LEVELS, USER_TYPES } from '../hooks/Admin/interface';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DataTable, { DataTableColumn, DataTableAction } from '../components/DataTable';
import EditUserDialog from '../components/EditUserDialog';

const FILTER_ARRAY = [
  { value: 'Today', status: 'Today' },
  { value: 'ByWeek', status: 'By Week' },
  { value: 'ByMonth', status: 'By Month' },
  { value: 'BySixMonths', status: 'By Six Months' },
  { value: 'ByYear', status: 'By Year' },
];

const Customer = () => {
 const [selectedFilter, setSelectedFilter] = useState<keyof Filter>('ByMonth');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const pageNumber = searchParams.get('page') || '1';
  const [page, setPage] = useState<number>(Number(pageNumber));
  const [limit] = useState(10);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const {
    data: customers,
    isLoading,
    error,
    isError,
  } = useFetchAllUsers({
    type: USER_TYPES.USER,
    page,
    limit,
    dateFilter: selectedFilter,
  });

  const showError = useCallback((errorMessage: string) => {
    toast(errorMessage, { type: 'error' });
  }, []);

  useEffect(() => {
    if (error) {
      showError(
        (error?.response?.data as { message?: string })?.message ||
          'Unknown error'
      );
    }
  }, [error, showError]);

  const totalPages = useMemo(
    () => Math.ceil((customers?.count ?? 0) / limit),
    [customers, limit]
  );

  const handleChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, filter: keyof Filter | null) => {
      if (filter) setSelectedFilter(filter);
    },
    []
  );

  useEffect(() => {
    const currentPage = searchParams.get('page');
    if (!currentPage) {
      setSearchParams({ page: '1' }, { replace: true });
    } else {
      setPage(Number(currentPage));
    }
  }, [searchParams, setSearchParams]);

  const handlePageChange = useCallback(
    (_: unknown, value: number) => {
      setPage(value);
      setSearchParams({ page: value.toString() });
    },
    [setSearchParams]
  );

  const handleRowClick = useCallback(
    (row: any) => {
      if (row?.id) navigate(`/customer/${row.id}`);
    },
    [navigate]
  );

  const handleEditClick = useCallback((row: any) => {
    setSelectedUser(row);
    setEditDialogOpen(true);
  }, []);

  const handleViewClick = useCallback(
    (row: any) => {
      if (row?.id) navigate(`/customer/${row.id}`);
    },
    [navigate]
  );

  const currentStart = useMemo(() => (page - 1) * limit + 1, [page, limit]);
  const currentEnd = useMemo(
    () => Math.min(page * limit, customers?.count || 0),
    [page, limit, customers?.count]
  );

  // Define table columns
  const columns: DataTableColumn[] = [
    {
      id: 'name',
      label: 'Name',
      minWidth: 150,
      accessor: (row: any) => row?.name || `${row?.firstName || ''} ${row?.lastName || ''}`.trim(),
    },
    {
      id: 'level',
      label: 'Level',
      minWidth: 100,
      render: (row: any) => (
        <Chip
          label={row?.level || 'N/A'}
          color={row?.level === LEVELS.LOYAL ? 'secondary' : 'default'}
          size="small"
          sx={{
            fontWeight: row?.level === LEVELS.LOYAL ? 'bold' : 'normal',
          }}
        />
      ),
    },
    {
      id: 'phone',
      label: 'Phone',
      minWidth: 140,
      accessor: 'phone',
    },
    {
      id: 'email',
      label: 'Email',
      minWidth: 200,
      accessor: 'email',
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      render: (row: any) => (
        <Chip
          label={row?.status || 'N/A'}
          color={
            row?.status === 'ACTIVE'
              ? 'success'
              : row?.status === 'INACTIVE'
              ? 'error'
              : 'default'
          }
          size="small"
        />
      ),
    },
    {
      id: 'createdAt',
      label: 'Created At',
      minWidth: 120,
      accessor: (row: any) =>
        row?.createdAt
          ? new Date(row.createdAt).toLocaleDateString()
          : 'N/A',
    },
  ];

  // Define table actions
  const actions: DataTableAction[] = [
    {
      label: 'View Details',
      icon: <Visibility fontSize="small" />,
      onClick: handleViewClick,
      color: 'primary',
    },
    {
      label: 'Edit User',
      icon: <Edit fontSize="small" />,
      onClick: handleEditClick,
      color: 'secondary',
    },
  ];

  return (
    <Box pr={5}>
      <ToastContainer />
      <Typography variant='h4' gutterBottom mb={5}>
        Customers
      </Typography>

      {/* Filter Buttons */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <ToggleButtonGroup
          color='primary'
          value={selectedFilter}
          exclusive
          onChange={handleChange}
          aria-label='Filter'
        >
          {FILTER_ARRAY.map((filter) => (
            <ToggleButton key={filter.value} value={filter.value}>
              {filter.status}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Loading State */}
      {isLoading ? (
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          height='200px'
        >
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          height='200px'
        >
          <Alert severity='error'>
            Failed to load customers. Please try again later.
          </Alert>
        </Box>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={customers?.data || []}
            actions={actions}
            onRowClick={handleRowClick}
            loading={isLoading}
            emptyMessage="No customers available"
            rowKey="id"
            maxHeight="65vh"
          />

          {/* Pagination */}
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='center'
            mt={2}
            py={2}
            px={2}
          >
            <Box flex='1' display='flex' justifyContent='center' ml={20}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color='primary'
              />
            </Box>
            {customers && (
              <Typography variant='body2' sx={{ ml: 3 }}>
                Showing{' '}
                {customers?.data?.length > 0
                  ? `${currentStart}-${currentEnd}`
                  : 0}{' '}
                of {customers?.count || 0} items
              </Typography>
            )}
          </Box>
        </>
      )}

      {/* Edit User Dialog */}
      <EditUserDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />
    </Box>
  );
};

export default Customer;
