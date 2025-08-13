import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Chip,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  Paper,
  AppBar,
  Toolbar,
  Badge,
  Divider,
  Avatar,
  Fab,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  useTheme,
  useMediaQuery,
  Stack,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  Restaurant as RestaurantIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { MenuItem, Table } from '../types';
import { apiService } from '../services/api';

const Menu: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tableInfo, setTableInfo] = useState<Table | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, { quantity: number; name: string; price: string }>>({});
  const [existingOrders, setExistingOrders] = useState<any[]>([]);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const tableUniqueId = searchParams.get('table');
  const roomUniqueId = searchParams.get('room');

  useEffect(() => {
    loadMenu();
    if (tableUniqueId) {
      loadTableInfo();
      loadExistingOrders(tableUniqueId, 'table');
    } else if (roomUniqueId) {
      loadRoomInfo();
      loadExistingOrders(roomUniqueId, 'room');
    }
    // Load saved cart if coming back
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setCart(parsed);
      } catch (error) {
        setCart({});
      }
    }
    
    // Check if user just placed an order (cart was cleared)
    const orderPlaced = sessionStorage.getItem('orderPlaced');
    if (orderPlaced) {
      setShowOrderSuccess(true);
      sessionStorage.removeItem('orderPlaced');
      setTimeout(() => setShowOrderSuccess(false), 5000);
    }
  }, [tableUniqueId, roomUniqueId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Persist cart for Cart page
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const loadMenu = async () => {
    try {
      const items = await apiService.getMenuItems();
      setMenuItems(items);
    } catch (error) {
      console.error('Failed to load menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTableInfo = async () => {
    try {
      const tables = await apiService.getTables();
      const table = tables.find(t => t.qr_unique_id === tableUniqueId);
      setTableInfo(table || null);
    } catch (error) {
      console.error('Failed to load table info:', error);
    }
  };

  const loadRoomInfo = async () => {
    try {
      const rooms = await apiService.getRooms();
      const room = rooms.find(r => r.qr_unique_id === roomUniqueId);
      if (room) {
        setTableInfo({
          id: room.id,
          table_name: room.room_name,
          table_number: room.room_number,
          capacity: room.capacity,
          qr_unique_id: room.qr_unique_id,
          is_occupied: room.is_active || false, // Use is_active as fallback
          floor: room.floor,
          is_active: room.is_active,
          created_at: room.created_at,
        } as Table);
      }
    } catch (error) {
      console.error('Failed to load room info:', error);
    }
  };

  const loadExistingOrders = async (uniqueId: string, type: 'table' | 'room') => {
    try {
      const orders = await apiService.getOrdersByTableUniqueId(uniqueId);
      setExistingOrders(orders);
    } catch (error) {
      console.error('Failed to load existing orders:', error);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => ({
      ...prev,
      [item.id]: {
        quantity: (prev[item.id]?.quantity || 0) + 1,
        name: item.name,
        price: item.price
      }
    }));
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId]?.quantity > 1) {
        newCart[itemId].quantity -= 1;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const getCartItemQuantity = (itemId: number) => {
    return cart[itemId]?.quantity || 0;
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return Object.values(cart).reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);
  };

  const getCategories = () => {
    const categories = Array.from(new Set(menuItems.map(item => item.category)));
    return ['all', ...categories];
  };

  const getFilteredItems = () => {
    if (selectedCategory === 'all') {
      return menuItems;
    }
    return menuItems.filter(item => item.category === selectedCategory);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'warning';
      case 'preparing': return 'info';
      case 'ready': return 'success';
      case 'delivered': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <ScheduleIcon />;
      case 'preparing': return <RestaurantIcon />;
      case 'ready': return <CheckCircleIcon />;
      case 'delivered': return <CheckCircleIcon />;
      default: return <ScheduleIcon />;
    }
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          color: 'white'
        }}
      >
        <CircularProgress size={80} sx={{ color: '#d32f2f', mb: 3 }} />
        <Typography variant="h5" sx={{ color: '#333', fontWeight: 'bold', mb: 1 }}>
          Loading Menu...
        </Typography>
        <Typography variant="body1" sx={{ color: '#666', opacity: 0.8 }}>
          Preparing delicious options for you
        </Typography>
      </Box>
    );
  }

  const categories = getCategories();
  const filteredItems = getFilteredItems();

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* App Bar */}
      <AppBar 
        position="sticky" 
        elevation={1}
        sx={{ 
          backgroundColor: '#d32f2f',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <RestaurantIcon sx={{ mr: 2, color: 'white' }} />
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
              {tableInfo ? `${tableInfo.table_name || `Table ${tableInfo.table_number}`}` : 'Digital Menu'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {existingOrders.length > 0 && (
              <Chip
                icon={<CheckCircleIcon />}
                label={`${existingOrders.length} Active Order${existingOrders.length > 1 ? 's' : ''}`}
                color="success"
                variant="outlined"
                sx={{ color: 'white', borderColor: 'white' }}
              />
            )}
            
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                const url = roomUniqueId ? `/bills?room=${roomUniqueId}` : (tableUniqueId ? `/bills?table=${tableUniqueId}` : '/bills');
                window.location.href = url;
              }}
              sx={{ 
                color: 'white', 
                borderColor: 'white',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              View Bills
            </Button>
            
            <Badge badgeContent={getTotalItems()} color="error">
              <IconButton
                onClick={() => setCartDrawerOpen(true)}
                sx={{ color: 'white' }}
              >
                <CartIcon />
              </IconButton>
            </Badge>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Success Message */}
        {showOrderSuccess && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              boxShadow: 2,
              '& .MuiAlert-icon': { fontSize: '2rem' }
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              ✅ Order Placed Successfully!
            </Typography>
            <Typography variant="body1">
              Your order has been placed and is being prepared. You can continue to add more items to your cart for additional orders!
            </Typography>
          </Alert>
        )}

        {/* Table Info */}
        {tableInfo && (
          <Paper 
            elevation={2}
            sx={{ 
              p: 3, 
              mb: 3, 
              borderRadius: 3,
              background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
              color: 'white'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                <RestaurantIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Welcome to {tableInfo.table_name || `Table ${tableInfo.table_number}`}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Capacity: {tableInfo.capacity} people • Scan this QR code to order directly from your table!
                </Typography>
              </Box>
            </Box>
          </Paper>
        )}

        {/* Existing Orders */}
        {existingOrders.length > 0 && (
          <Paper 
            elevation={2}
            sx={{ 
              p: 3, 
              mb: 3, 
              borderRadius: 3,
              background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
              border: '1px solid #ffcc02'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#e65100' }}>
                📋 Your Active Orders
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  if (tableUniqueId) {
                    loadExistingOrders(tableUniqueId, 'table');
                  } else if (roomUniqueId) {
                    loadExistingOrders(roomUniqueId, 'room');
                  }
                }}
                sx={{ color: '#e65100', borderColor: '#e65100' }}
              >
                Refresh
              </Button>
            </Box>
            <Typography variant="body2" sx={{ mb: 2, color: '#e65100' }}>
              You have {existingOrders.length} active order(s). You can place additional orders anytime!
            </Typography>
            <Stack spacing={2}>
              {existingOrders.map((order, index) => (
                <Paper 
                  key={order.id}
                  sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    border: '1px solid #ffcc02',
                    background: 'rgba(255,255,255,0.8)'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#e65100' }}>
                        Order #{order.id} - {order.status.toUpperCase()}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#e65100', opacity: 0.8 }}>
                        Total: ₹{parseFloat(order.price).toFixed(2)} | Items: {JSON.parse(order.items_json || '{}').length}
                      </Typography>
                    </Box>
                    <Chip
                      icon={getStatusIcon(order.status)}
                      label={order.status.toUpperCase()}
                      color={getStatusColor(order.status) as any}
                      size="small"
                    />
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      const url = roomUniqueId 
                        ? `/order-tracking/${order.id}?room=${roomUniqueId}` 
                        : (tableUniqueId 
                          ? `/order-tracking/${order.id}?table=${tableUniqueId}` 
                          : `/order-tracking/${order.id}`);
                      window.location.href = url;
                    }}
                    sx={{ mt: 1, color: '#e65100', borderColor: '#e65100' }}
                  >
                    Track Order
                  </Button>
                </Paper>
              ))}
            </Stack>
          </Paper>
        )}

        {/* Category Filter */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#333', mb: 3 }}>
            🍽️ Menu
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
            {existingOrders.length > 0 
              ? "Feel free to add more items to your order! You can place multiple orders."
              : "Browse our delicious menu and add items to your cart."
            }
          </Typography>
          
          <Tabs 
            value={selectedCategory} 
            onChange={(_, newValue) => setSelectedCategory(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              backgroundColor: '#f5f5f5',
              borderRadius: 2,
              p: 1,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                minWidth: 'auto',
                px: 3,
                py: 1.5,
                borderRadius: 2,
                mx: 0.5,
                color: '#666',
                transition: 'all 0.2s ease',
                position: 'relative',
                '&:hover': {
                  backgroundColor: 'rgba(211, 47, 47, 0.1)',
                  color: '#d32f2f',
                }
              },
              '& .Mui-selected': {
                backgroundColor: '#d32f2f',
                color: 'white !important',
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(211, 47, 47, 0.3)',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -2,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '20px',
                  height: '3px',
                  backgroundColor: '#d32f2f',
                  borderRadius: '2px',
                },
                '&:hover': {
                  backgroundColor: '#b71c1c',
                  color: 'white !important',
                  boxShadow: '0 4px 12px rgba(211, 47, 47, 0.4)',
                }
              },
              '& .MuiTabs-indicator': {
                display: 'none', // Hide the default indicator since we're using background color
              }
            }}
          >
            {categories.map((category) => (
              <Tab 
                key={category} 
                value={category}
                label={category === 'all' ? 'All Items' : category}
              />
            ))}
          </Tabs>
        </Box>

        {/* Menu Items */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: 'repeat(2, 1fr)', 
            lg: 'repeat(3, 1fr)',
            xl: 'repeat(4, 1fr)'
          }, 
          gap: 3 
        }}>
          {filteredItems.map((item) => (
            <Card 
              key={item.id}
              elevation={2}
              sx={{ 
                borderRadius: 3,
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                border: '1px solid #e0e0e0',
                '&:hover': { 
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                  borderColor: '#d32f2f',
                }
              }}
            >
              <CardMedia
                component="img"
                height="200"
                image={item.image_url}
                alt={item.name}
                sx={{ 
                  objectFit: 'cover',
                }}
              />
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#333' }}>
                      {item.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', mb: 2, lineHeight: 1.6 }}>
                      {item.description}
                    </Typography>
                  </Box>
                  <Chip 
                    label={item.category} 
                    size="small" 
                    sx={{ 
                      backgroundColor: '#d32f2f',
                      color: 'white',
                      fontWeight: 600,
                      ml: 1
                    }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#d32f2f' }}>
                    ₹{item.price}
                  </Typography>
                  <Typography variant="body2" sx={{ color: item.is_available ? '#4caf50' : '#f44336' }}>
                    {item.is_available ? 'Available' : 'Not Available'}
                  </Typography>
                </Box>
                
                {/* Cart Controls */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getCartItemQuantity(item.id) > 0 && (
                    <IconButton
                      size="small"
                      onClick={() => removeFromCart(item.id)}
                      sx={{ 
                        backgroundColor: '#ffebee',
                        '&:hover': { backgroundColor: '#ffcdd2' }
                      }}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                  )}
                  
                  {getCartItemQuantity(item.id) > 0 && (
                    <Typography variant="h6" sx={{ minWidth: 30, textAlign: 'center', fontWeight: 600, color: '#d32f2f' }}>
                      {getCartItemQuantity(item.id)}
                    </Typography>
                  )}
                  
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => addToCart(item)}
                    fullWidth
                    disabled={!item.is_available}
                    sx={{ 
                      borderRadius: 2,
                      fontWeight: 600,
                      backgroundColor: '#d32f2f',
                      '&:hover': {
                        backgroundColor: '#b71c1c',
                      },
                      '&:disabled': {
                        backgroundColor: '#ccc',
                        color: '#666',
                      }
                    }}
                  >
                    {getCartItemQuantity(item.id) > 0 ? 'Add More' : 'Add to Cart'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>

      {/* Floating Cart Button */}
      {getTotalItems() > 0 && (
        <Fab
          color="primary"
          aria-label="cart"
          onClick={() => {
            const url = roomUniqueId ? `/cart?room=${roomUniqueId}` : (tableUniqueId ? `/cart?table=${tableUniqueId}` : '/cart');
            window.location.href = url;
          }}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            backgroundColor: '#d32f2f',
            '&:hover': {
              backgroundColor: '#b71c1c',
              transform: 'scale(1.05)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          <Badge badgeContent={getTotalItems()} color="error">
            <CartIcon />
          </Badge>
        </Fab>
      )}

      {/* Cart Drawer */}
      <Drawer
        anchor="right"
        open={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 400 } }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Your Cart ({getTotalItems()} items)
            </Typography>
            <IconButton onClick={() => setCartDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          {Object.keys(cart).length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CartIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Your cart is empty
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add some delicious items to get started
              </Typography>
            </Box>
          ) : (
            <>
              <List>
                {Object.entries(cart).map(([itemId, item]) => (
                  <ListItem key={itemId} sx={{ px: 0 }}>
                    <ListItemText
                      primary={item.name}
                      secondary={`₹${item.price} each`}
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => removeFromCart(parseInt(itemId))}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <Typography variant="h6" sx={{ minWidth: 30, textAlign: 'center' }}>
                          {item.quantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => addToCart({ id: parseInt(itemId), name: item.name, price: item.price } as MenuItem)}
                        >
                          <AddIcon />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Total: ₹{getTotalPrice().toFixed(2)}
                </Typography>
              </Box>

              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => {
                  const url = roomUniqueId ? `/cart?room=${roomUniqueId}` : (tableUniqueId ? `/cart?table=${tableUniqueId}` : '/cart');
                  window.location.href = url;
                }}
                startIcon={<ReceiptIcon />}
                sx={{
                  borderRadius: 2,
                  fontWeight: 600,
                  backgroundColor: '#d32f2f',
                  '&:hover': {
                    backgroundColor: '#b71c1c'
                  }
                }}
              >
                Proceed to Checkout
              </Button>
            </>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default Menu;
