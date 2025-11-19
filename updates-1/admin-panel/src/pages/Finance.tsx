import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Chip,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  ArrowUpward,
  ArrowDownward,
  CalendarToday,
  Download,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../api';

interface FinanceOverview {
  period: {
    startDate: string;
    endDate: string;
  };
  inflow: {
    totalRevenue: number;
    itemRevenue: number;
    serviceCharges: number;
    deliveryFees: number;
    vatCollected: number;
    transferCharges: number;
    orderCount: number;
  };
  outflow: {
    vendorEarnings: number;
    withdrawalsCompleted: number;
    pendingWithdrawals: number;
    withdrawalCount: number;
  };
  platformGains: {
    grossProfit: number;
    itemMarkup: number;
    serviceCharges: number;
    deliveryFees: number;
    transferCharges: number;
    netProfit: number;
  };
  summary: {
    totalInflow: number;
    totalOutflow: number;
    netCashflow: number;
    pendingPayables: number;
  };
}

interface MonthlyData {
  month: number;
  monthName: string;
  year: number;
  revenue: number;
  serviceCharges: number;
  deliveryFees: number;
  vatCollected: number;
  withdrawals: number;
  orderCount: number;
}

interface VendorEarning {
  laundryId: string;
  laundryName: string;
  vendorName: string;
  vendorPhone: string;
  orderCount: number;
  totalEarning: number;
  disbursedEarning: number;
  pendingEarning: number;
}

const SummaryCard = ({ title, value, subtitle, icon, color, trend }: any) => (
  <Card elevation={3} sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography color="textSecondary" variant="body2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h5" component="div" fontWeight="bold" color={color}>
            {typeof value === 'number' ? `${value.toLocaleString()} SAR` : value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="textSecondary" mt={0.5}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {icon}
      </Box>
      {trend !== undefined && (
        <Box display="flex" alignItems="center" mt={1}>
          {trend >= 0 ? (
            <TrendingUp sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
          ) : (
            <TrendingDown sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
          )}
          <Typography variant="body2" color={trend >= 0 ? 'success.main' : 'error.main'}>
            {trend >= 0 ? '+' : ''}{trend}% vs last month
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

const Finance: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [startDate, setStartDate] = useState<Date | null>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date | null>(new Date());

  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery<FinanceOverview>({
    queryKey: ['finance-overview', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      const response = await api.get(`/admin/dashboard/finance/overview?${params}`);
      return response.data;
    },
  });

  const { data: monthlyData } = useQuery<MonthlyData[]>({
    queryKey: ['finance-monthly'],
    queryFn: async () => {
      const response = await api.get('/admin/dashboard/finance/monthly');
      return response.data;
    },
  });

  const { data: vendorEarnings } = useQuery<VendorEarning[]>({
    queryKey: ['vendor-earnings', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      const response = await api.get(`/admin/dashboard/finance/vendor-earnings?${params}`);
      return response.data;
    },
  });

  const { data: dailyRevenue } = useQuery({
    queryKey: ['daily-revenue'],
    queryFn: async () => {
      const response = await api.get('/admin/dashboard/finance/daily-revenue?days=30');
      return response.data;
    },
  });

  if (overviewLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (overviewError || !overview) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load finance data. Please try refreshing the page.
      </Alert>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              <AccountBalance sx={{ mr: 1, verticalAlign: 'middle' }} />
              Finance
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Track platform revenue, expenses, and vendor payouts
            </Typography>
          </Box>
          <Box display="flex" gap={2} alignItems="center">
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              slotProps={{ textField: { size: 'small' } }}
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              slotProps={{ textField: { size: 'small' } }}
            />
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard
              title="Total Inflow"
              value={overview.summary.totalInflow}
              subtitle={`${overview.inflow.orderCount} orders`}
              icon={<ArrowUpward sx={{ color: 'success.main', fontSize: 40 }} />}
              color="success.main"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard
              title="Total Outflow"
              value={overview.summary.totalOutflow}
              subtitle={`${overview.outflow.withdrawalCount} withdrawals`}
              icon={<ArrowDownward sx={{ color: 'error.main', fontSize: 40 }} />}
              color="error.main"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard
              title="Net Cashflow"
              value={overview.summary.netCashflow}
              subtitle="Inflow - Outflow"
              icon={<TrendingUp sx={{ color: 'primary.main', fontSize: 40 }} />}
              color="primary.main"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard
              title="Platform Net Profit"
              value={overview.platformGains.netProfit}
              subtitle="After all deductions"
              icon={<AccountBalance sx={{ color: 'info.main', fontSize: 40 }} />}
              color="info.main"
            />
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card elevation={3} sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Overview" />
            <Tab label="Monthly Breakdown" />
            <Tab label="Vendor Earnings" />
            <Tab label="Daily Revenue" />
          </Tabs>

          <CardContent>
            {/* Overview Tab */}
            {tabValue === 0 && (
              <Grid container spacing={3}>
                {/* Inflow Breakdown */}
                <Grid item xs={12} md={4}>
                  <Typography variant="h6" gutterBottom color="success.main">
                    <ArrowUpward sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Inflow Breakdown
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>Item Revenue</TableCell>
                          <TableCell align="right">{overview.inflow.itemRevenue.toLocaleString()} SAR</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Service Charges</TableCell>
                          <TableCell align="right">{overview.inflow.serviceCharges.toLocaleString()} SAR</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Delivery Fees</TableCell>
                          <TableCell align="right">{overview.inflow.deliveryFees.toLocaleString()} SAR</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>VAT Collected</TableCell>
                          <TableCell align="right">{overview.inflow.vatCollected.toLocaleString()} SAR</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Transfer Charges</TableCell>
                          <TableCell align="right">{overview.inflow.transferCharges.toLocaleString()} SAR</TableCell>
                        </TableRow>
                        <TableRow sx={{ backgroundColor: 'success.light' }}>
                          <TableCell><strong>Total</strong></TableCell>
                          <TableCell align="right"><strong>{overview.inflow.totalRevenue.toLocaleString()} SAR</strong></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* Outflow Breakdown */}
                <Grid item xs={12} md={4}>
                  <Typography variant="h6" gutterBottom color="error.main">
                    <ArrowDownward sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Outflow Breakdown
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>Vendor Earnings (Total)</TableCell>
                          <TableCell align="right">{overview.outflow.vendorEarnings.toLocaleString()} SAR</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Withdrawals Completed</TableCell>
                          <TableCell align="right">{overview.outflow.withdrawalsCompleted.toLocaleString()} SAR</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Pending Withdrawals</TableCell>
                          <TableCell align="right">{overview.outflow.pendingWithdrawals.toLocaleString()} SAR</TableCell>
                        </TableRow>
                        <TableRow sx={{ backgroundColor: 'warning.light' }}>
                          <TableCell><strong>Pending Payables</strong></TableCell>
                          <TableCell align="right"><strong>{overview.summary.pendingPayables.toLocaleString()} SAR</strong></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* Platform Gains */}
                <Grid item xs={12} md={4}>
                  <Typography variant="h6" gutterBottom color="primary.main">
                    <AccountBalance sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Platform Gains
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>Item Markup</TableCell>
                          <TableCell align="right">{overview.platformGains.itemMarkup.toLocaleString()} SAR</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Service Charges</TableCell>
                          <TableCell align="right">{overview.platformGains.serviceCharges.toLocaleString()} SAR</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Delivery Fees</TableCell>
                          <TableCell align="right">{overview.platformGains.deliveryFees.toLocaleString()} SAR</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Transfer Charges</TableCell>
                          <TableCell align="right">{overview.platformGains.transferCharges.toLocaleString()} SAR</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Gross Profit</TableCell>
                          <TableCell align="right">{overview.platformGains.grossProfit.toLocaleString()} SAR</TableCell>
                        </TableRow>
                        <TableRow sx={{ backgroundColor: 'primary.light' }}>
                          <TableCell><strong>Net Profit</strong></TableCell>
                          <TableCell align="right"><strong>{overview.platformGains.netProfit.toLocaleString()} SAR</strong></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            )}

            {/* Monthly Breakdown Tab */}
            {tabValue === 1 && monthlyData && (
              <Box>
                <Box mb={3}>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="monthName" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue" fill="#8884d8" />
                      <Bar dataKey="withdrawals" name="Withdrawals" fill="#82ca9d" />
                      <Bar dataKey="serviceCharges" name="Service Charges" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Month</TableCell>
                        <TableCell align="right">Orders</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                        <TableCell align="right">Service Charges</TableCell>
                        <TableCell align="right">Delivery Fees</TableCell>
                        <TableCell align="right">VAT</TableCell>
                        <TableCell align="right">Withdrawals</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {monthlyData.map((month) => (
                        <TableRow key={`${month.year}-${month.month}`}>
                          <TableCell>{month.monthName} {month.year}</TableCell>
                          <TableCell align="right">{month.orderCount}</TableCell>
                          <TableCell align="right">{month.revenue.toLocaleString()} SAR</TableCell>
                          <TableCell align="right">{month.serviceCharges.toLocaleString()} SAR</TableCell>
                          <TableCell align="right">{month.deliveryFees.toLocaleString()} SAR</TableCell>
                          <TableCell align="right">{month.vatCollected.toLocaleString()} SAR</TableCell>
                          <TableCell align="right">{month.withdrawals.toLocaleString()} SAR</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Vendor Earnings Tab */}
            {tabValue === 2 && vendorEarnings && (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Laundry</TableCell>
                      <TableCell>Vendor</TableCell>
                      <TableCell align="right">Orders</TableCell>
                      <TableCell align="right">Total Earning</TableCell>
                      <TableCell align="right">Disbursed</TableCell>
                      <TableCell align="right">Pending</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vendorEarnings.map((vendor) => (
                      <TableRow key={vendor.laundryId}>
                        <TableCell>{vendor.laundryName}</TableCell>
                        <TableCell>
                          {vendor.vendorName || 'N/A'}
                          <br />
                          <Typography variant="caption" color="textSecondary">
                            {vendor.vendorPhone}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{vendor.orderCount}</TableCell>
                        <TableCell align="right">{vendor.totalEarning.toLocaleString()} SAR</TableCell>
                        <TableCell align="right" sx={{ color: 'success.main' }}>
                          {vendor.disbursedEarning.toLocaleString()} SAR
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'warning.main' }}>
                          {vendor.pendingEarning.toLocaleString()} SAR
                        </TableCell>
                        <TableCell>
                          {vendor.pendingEarning > 0 ? (
                            <Chip label="Pending Payment" size="small" color="warning" />
                          ) : (
                            <Chip label="Paid" size="small" color="success" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Daily Revenue Tab */}
            {tabValue === 3 && dailyRevenue && (
              <Box>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="serviceCharges" name="Service Charges" stroke="#82ca9d" strokeWidth={2} />
                    <Line type="monotone" dataKey="deliveryFees" name="Delivery Fees" stroke="#ffc658" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
                <TableContainer component={Paper} sx={{ mt: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Orders</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                        <TableCell align="right">Service Charges</TableCell>
                        <TableCell align="right">Delivery Fees</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dailyRevenue.slice(-10).reverse().map((day: any) => (
                        <TableRow key={day.date}>
                          <TableCell>{day.date}</TableCell>
                          <TableCell align="right">{day.orders}</TableCell>
                          <TableCell align="right">{day.revenue.toLocaleString()} SAR</TableCell>
                          <TableCell align="right">{day.serviceCharges.toLocaleString()} SAR</TableCell>
                          <TableCell align="right">{day.deliveryFees.toLocaleString()} SAR</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default Finance;
