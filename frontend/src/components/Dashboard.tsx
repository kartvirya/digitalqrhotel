import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Paper,
  Tabs,
  Tab,
  Button,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
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
  Avatar,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  People as PeopleIcon,
  TableRestaurant as TableIcon,
  Business as FloorIcon,
  MenuBook as MenuIcon,
  Assessment as AnalyticsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { 
  Order, 
  MenuItem as MenuItemType, 
  Staff, 
  Table as TableType, 
  Floor, 
  DashboardStats 
} from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [tables, setTables] = useState<TableType[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);

  // Dialog states
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [
        statsData,
        ordersData,
        menuData,
        staffData,
        tablesData,
        floorsData,
      ] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getOrders(),
        apiService.getMenuItems(),
        apiService.getStaff(),
        apiService.getTables(),
        apiService.getFloors(),
      ]);

      setStats(statsData);
      setOrders(ordersData);
      setMenuItems(menuData);
      setStaff(staffData);
      setTables(tablesData);
      setFloors(floorsData);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderStatusUpdate = async (orderId: number, status: string) => {
    try {
      await apiService.updateOrderStatus(orderId, status);
      setSuccess(`Order status updated to ${status}`);
      loadDashboardData();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update order status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'preparing': return 'info';
      case 'ready': return 'success';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  if (!user?.is_superuser && !user?.cafe_manager) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" color="error">
          Access Denied
        </Typography>
        <Typography variant="body1">
          You don't have permission to access the dashboard.
        </Typography>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Restaurant Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MoneyIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    ₹{stats.total_revenue || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <RestaurantIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {stats.total_orders || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Orders
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PeopleIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {staff.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Staff
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TableIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {tables.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available Tables
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Dashboard Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          aria-label="dashboard tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Orders" icon={<RestaurantIcon />} />
          <Tab label="Staff" icon={<PeopleIcon />} />
          <Tab label="Tables" icon={<TableIcon />} />
          <Tab label="Floors" icon={<FloorIcon />} />
          <Tab label="Menu" icon={<MenuIcon />} />
          <Tab label="Analytics" icon={<AnalyticsIcon />} />
        </Tabs>

        {/* Orders Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Recent Orders</Typography>
            <Button variant="outlined" onClick={loadDashboardData}>
              Refresh
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Table</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.slice(0, 10).map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>#{order.id}</TableCell>
                    <TableCell>{order.table_unique_id}</TableCell>
                    <TableCell>
                      {order.items_json ? JSON.parse(order.items_json).length || 0 : 0} items
                    </TableCell>
                                          <TableCell>₹{order.price || 0}</TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        color={getStatusColor(order.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedOrder(order);
                            setOpenOrderDialog(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        {order.status === 'pending' && (
                          <>
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleOrderStatusUpdate(order.id, 'preparing')}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleOrderStatusUpdate(order.id, 'ready')}
                            >
                              <CheckIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleOrderStatusUpdate(order.id, 'cancelled')}
                            >
                              <CancelIcon />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Staff Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Staff Overview</Typography>
            <Button variant="contained" startIcon={<AddIcon />}>
              Add Staff
            </Button>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
            {staff.slice(0, 6).map((member) => (
              <Card key={member.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2 }}>
                      {member.first_name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {member.full_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {member.employee_id}
                      </Typography>
                    </Box>
                  </Box>
                                      <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Department:</strong> {member.department?.name}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Role:</strong> {member.role?.name}
                    </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Salary:</strong> ₹{member.salary}
                  </Typography>
                  <Chip
                    label={member.employment_status}
                    color={member.employment_status === 'active' ? 'success' : 'error'}
                    size="small"
                  />
                </CardContent>
              </Card>
            ))}
          </Box>
        </TabPanel>

        {/* Tables Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Table Management</Typography>
            <Button variant="contained" startIcon={<AddIcon />}>
              Add Table
            </Button>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 3 }}>
            {tables.slice(0, 8).map((table) => (
              <Card key={table.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TableIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="h6">
                        {table.table_name || `Table ${table.table_number}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {table.floor_name}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Capacity:</strong> {table.capacity} seats
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>QR Code:</strong> {table.qr_unique_id}
                  </Typography>
                  <Chip
                    label={table.is_active ? 'Active' : 'Inactive'}
                    color={table.is_active ? 'success' : 'error'}
                    size="small"
                  />
                </CardContent>
              </Card>
            ))}
          </Box>
        </TabPanel>

        {/* Floors Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Floor Management</Typography>
            <Button variant="contained" startIcon={<AddIcon />}>
              Add Floor
            </Button>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
            {floors.map((floor) => (
              <Card key={floor.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <FloorIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="h6">
                        {floor.name}
                      </Typography>
                      {floor.description && (
                        <Typography variant="body2" color="text.secondary">
                          {floor.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>Tables:</strong> {floor.table_count || 0}
                  </Typography>
                  <Chip
                    label={floor.is_active ? 'Active' : 'Inactive'}
                    color={floor.is_active ? 'success' : 'error'}
                    size="small"
                  />
                </CardContent>
              </Card>
            ))}
          </Box>
        </TabPanel>

        {/* Menu Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Menu Items</Typography>
            <Button variant="contained" startIcon={<AddIcon />}>
              Add Item
            </Button>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
            {menuItems.slice(0, 8).map((item) => (
              <Card key={item.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <RestaurantIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="h6">
                        {item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.category}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Price:</strong> ₹{item.price}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Description:</strong> {item.description}
                  </Typography>
                  <Chip
                    label={item.is_available ? 'Available' : 'Unavailable'}
                    color={item.is_available ? 'success' : 'error'}
                    size="small"
                  />
                </CardContent>
              </Card>
            ))}
          </Box>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={tabValue} index={5}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Restaurant Analytics
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Revenue Trends
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Revenue: ₹{stats?.total_revenue || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Order Value: ₹{stats?.average_order_value || 0}
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Order Statistics
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Orders: {stats?.total_orders || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Orders: {stats?.pending_orders || 0}
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  <PeopleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Staff Overview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Staff: {staff.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Staff: {staff.filter(s => s.employment_status === 'active').length}
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  <TableIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Table Status
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Tables: {tables.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Available Tables: {tables.filter(t => t.is_active).length}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>
      </Paper>

      {/* Order Details Dialog */}
      <Dialog open={openOrderDialog} onClose={() => setOpenOrderDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Order Details #{selectedOrder?.id}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Table: {selectedOrder.table_unique_id}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Status:</strong> {selectedOrder.status}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Order Time:</strong> {new Date(selectedOrder.created_at).toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Total Amount:</strong> ₹{selectedOrder.price}
              </Typography>

              <Typography variant="h6" sx={{ mb: 1 }}>
                Order Items:
              </Typography>
              <List>
                {selectedOrder.items_json ? Object.entries(JSON.parse(selectedOrder.items_json)).map(([id, data]: [string, any], index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={data[1]}
                      secondary={`Quantity: ${data[0]} | Price: ₹${data[2]}`}
                    />
                  </ListItem>
                )) : null}
              </List>

              {selectedOrder.special_instructions && (
                <Typography variant="body2" sx={{ mt: 2 }}>
                  <strong>Special Instructions:</strong> {selectedOrder.special_instructions}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenOrderDialog(false)}>
            Close
          </Button>
          {selectedOrder?.status === 'pending' && (
            <>
              <Button
                onClick={() => {
                  handleOrderStatusUpdate(selectedOrder.id, 'preparing');
                  setOpenOrderDialog(false);
                }}
                color="info"
              >
                Mark Preparing
              </Button>
              <Button
                onClick={() => {
                  handleOrderStatusUpdate(selectedOrder.id, 'ready');
                  setOpenOrderDialog(false);
                }}
                color="success"
              >
                Mark Ready
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;
