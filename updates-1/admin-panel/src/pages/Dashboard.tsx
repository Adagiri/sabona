import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  People,
  Store,
  LocalShipping,
  AttachMoney,
  Timer,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../api';

interface DashboardMetrics {
  orders: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    completed: number;
    cancelled: number;
    pending: number;
    inProgress: number;
    normalDelivery: number;
    expressDelivery: number;
    completionRate: string | number;
    cancellationRate: string | number;
  };
  revenue: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
    growthPercentage: number;
    averageOrderValue: number;
  };
  platformEarnings: {
    serviceCharges: number;
    deliveryFees: number;
    vatCollected: number;
    total: number;
  };
  customers: {
    total: number;
    active: number;
    newToday: number;
    newThisMonth: number;
  };
  vendors: {
    total: number;
    active: number;
    laundries: number;
    activeLaundries: number;
  };
  drivers: {
    total: number;
    active: number;
  };
  topLaundries: Array<{
    id: string;
    name: string;
    orderCount: number;
    revenue: number;
  }>;
  orderStatusDistribution: Array<{
    status: string;
    count: number;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: number;
    status: string;
    totalAmount: number;
    deliveryType: string;
    customerName: string;
    laundryName: string;
    createdAt: string;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const StatCard = ({ title, value, subtitle, icon, color = 'primary', trend }: any) => (
  <Card elevation={3}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography color="textSecondary" variant="body2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="div" fontWeight="bold">
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="textSecondary">
              {subtitle}
            </Typography>
          )}
          {trend !== undefined && (
            <Box display="flex" alignItems="center" mt={1}>
              {trend >= 0 ? (
                <TrendingUp sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
              ) : (
                <TrendingDown sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
              )}
              <Typography
                variant="body2"
                color={trend >= 0 ? 'success.main' : 'error.main'}
              >
                {trend >= 0 ? '+' : ''}{trend}%
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            borderRadius: 2,
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const { data: metrics, isLoading, error } = useQuery<DashboardMetrics>({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const response = await api.get('/admin/dashboard/metrics');
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: trends } = useQuery({
    queryKey: ['order-trends'],
    queryFn: async () => {
      const response = await api.get('/admin/dashboard/trends?days=30');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !metrics) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load dashboard data. Please try refreshing the page.
      </Alert>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      COMPLETED: 'success',
      CANCELLED: 'error',
      PENDING: 'warning',
      PENDING_PAYMENT: 'warning',
      ACCEPTED: 'info',
      IN_PROGRESS: 'info',
      READY_FOR_PICKUP: 'primary',
      REJECTED: 'error',
    };
    return colors[status] || 'default';
  };

  return (
    <Box p={3}>
      <Box mb={3}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Welcome back! Here's what's happening with your platform.
        </Typography>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`${metrics.revenue.total.toLocaleString()} SAR`}
            subtitle={`Today: ${metrics.revenue.today.toLocaleString()} SAR`}
            icon={<AttachMoney sx={{ color: 'success.main' }} />}
            color="success"
            trend={metrics.revenue.growthPercentage}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Orders"
            value={metrics.orders.total.toLocaleString()}
            subtitle={`Today: ${metrics.orders.today}`}
            icon={<ShoppingCart sx={{ color: 'primary.main' }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Customers"
            value={metrics.customers.total.toLocaleString()}
            subtitle={`New today: ${metrics.customers.newToday}`}
            icon={<People sx={{ color: 'info.main' }} />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Laundries"
            value={metrics.vendors.activeLaundries}
            subtitle={`Total vendors: ${metrics.vendors.total}`}
            icon={<Store sx={{ color: 'warning.main' }} />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Platform Earnings & Order Stats */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Platform Earnings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Service Charges</Typography>
                  <Typography variant="h6">{metrics.platformEarnings.serviceCharges.toLocaleString()} SAR</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Delivery Fees</Typography>
                  <Typography variant="h6">{metrics.platformEarnings.deliveryFees.toLocaleString()} SAR</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">VAT Collected</Typography>
                  <Typography variant="h6">{metrics.platformEarnings.vatCollected.toLocaleString()} SAR</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Total</Typography>
                  <Typography variant="h6" color="primary">{metrics.platformEarnings.total.toLocaleString()} SAR</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <CheckCircle sx={{ color: 'success.main', mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">Completion Rate</Typography>
                  </Box>
                  <Typography variant="h6" color="success.main">{metrics.orders.completionRate}%</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Cancel sx={{ color: 'error.main', mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">Cancellation Rate</Typography>
                  </Box>
                  <Typography variant="h6" color="error.main">{metrics.orders.cancellationRate}%</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <LocalShipping sx={{ color: 'info.main', mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">Normal Delivery</Typography>
                  </Box>
                  <Typography variant="h6">{metrics.orders.normalDelivery}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Timer sx={{ color: 'warning.main', mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">Express Delivery</Typography>
                  </Box>
                  <Typography variant="h6">{metrics.orders.expressDelivery}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revenue Trend (Last 30 Days)
              </Typography>
              {trends && trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="orders" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box height={300} display="flex" alignItems="center" justifyContent="center">
                  <Typography color="textSecondary">No trend data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Status Distribution
              </Typography>
              {metrics.orderStatusDistribution && metrics.orderStatusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics.orderStatusDistribution}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ status, count }) => `${status}: ${count}`}
                    >
                      {metrics.orderStatusDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box height={300} display="flex" alignItems="center" justifyContent="center">
                  <Typography color="textSecondary">No data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Laundries & Recent Orders */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Performing Laundries
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Laundry</TableCell>
                      <TableCell align="right">Orders</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metrics.topLaundries.map((laundry, index) => (
                      <TableRow key={laundry.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Chip
                              label={index + 1}
                              size="small"
                              color={index === 0 ? 'primary' : 'default'}
                              sx={{ mr: 1 }}
                            />
                            {laundry.name}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{laundry.orderCount}</TableCell>
                        <TableCell align="right">{laundry.revenue.toLocaleString()} SAR</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Orders
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Order #</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metrics.recentOrders.slice(0, 5).map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>#{order.orderNumber}</TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>{order.totalAmount} SAR</TableCell>
                        <TableCell>
                          <Chip
                            label={order.status}
                            size="small"
                            color={getStatusColor(order.status) as any}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Orders Progress */}
      <Grid container spacing={3} mt={1}>
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Order Status
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary">Pending</Typography>
                  <Box display="flex" alignItems="center">
                    <Box width="100%" mr={1}>
                      <LinearProgress
                        variant="determinate"
                        value={(metrics.orders.pending / metrics.orders.total) * 100}
                        color="warning"
                      />
                    </Box>
                    <Typography variant="body2">{metrics.orders.pending}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary">In Progress</Typography>
                  <Box display="flex" alignItems="center">
                    <Box width="100%" mr={1}>
                      <LinearProgress
                        variant="determinate"
                        value={(metrics.orders.inProgress / metrics.orders.total) * 100}
                        color="info"
                      />
                    </Box>
                    <Typography variant="body2">{metrics.orders.inProgress}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary">Completed</Typography>
                  <Box display="flex" alignItems="center">
                    <Box width="100%" mr={1}>
                      <LinearProgress
                        variant="determinate"
                        value={(metrics.orders.completed / metrics.orders.total) * 100}
                        color="success"
                      />
                    </Box>
                    <Typography variant="body2">{metrics.orders.completed}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
