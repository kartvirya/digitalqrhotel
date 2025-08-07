import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  TextField,
  Card,
  CardContent,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Chip
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CartItem } from '../types';
import { apiService } from '../services/api';

const Cart: React.FC = () => {
  const [cart, setCart] = useState<Record<number, CartItem>>({});
  const [tableUniqueId, setTableUniqueId] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    // Get table info from URL params
    const tableId = searchParams.get('table');
    if (tableId) {
      setTableUniqueId(tableId);
    }
  }, [searchParams]);

  useEffect(() => {
    // Save cart to localStorage whenever it changes
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const updateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      const newCart = { ...cart };
      delete newCart[itemId];
      setCart(newCart);
    } else {
      setCart(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          quantity: newQuantity
        }
      }));
    }
  };

  const getTotalPrice = () => {
    return Object.values(cart).reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((total, item) => total + item.quantity, 0);
  };

  const handlePlaceOrder = async () => {
    if (getTotalItems() === 0) {
      setError('Your cart is empty');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const orderItems = Object.values(cart).map(item => ({
        menu_item: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const orderData = {
        items: orderItems,
        table_unique_id: tableUniqueId,
        special_instructions: specialInstructions,
        total_amount: getTotalPrice()
      };

      await apiService.createOrder(orderData);
      
      // Clear cart after successful order
      setCart({});
      localStorage.removeItem('cart');
      
      setSuccess('Order placed successfully!');
      setTimeout(() => {
        navigate('/my-orders');
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (getTotalItems() === 0) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Your Cart is Empty
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Add some items to your cart to get started.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            size="large"
          >
            Browse Menu
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Shopping Cart ({getTotalItems()} items)
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

      <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 3 }}>
        {/* Cart Items */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Order Items
          </Typography>
          
          {Object.values(cart).map((item) => (
            <Card key={item.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6">{item.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      ₹{item.price} each
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <RemoveIcon />
                    </IconButton>
                    
                    <Typography variant="body1" sx={{ minWidth: 30, textAlign: 'center' }}>
                      {item.quantity}
                    </Typography>
                    
                    <IconButton
                      size="small"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <AddIcon />
                    </IconButton>
                    
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => updateQuantity(item.id, 0)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                
                <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                  Total: ₹{item.price * item.quantity}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Paper>

        {/* Order Summary */}
        <Paper sx={{ p: 3, height: 'fit-content' }}>
          <Typography variant="h6" gutterBottom>
            Order Summary
          </Typography>

          {tableUniqueId && (
            <Box sx={{ mb: 2 }}>
              <Chip label={`Table: ${tableUniqueId}`} color="primary" />
            </Box>
          )}

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Special Instructions"
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="Any special requests or dietary requirements..."
          />

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 2 }}>
            <Typography variant="body1">
              Items: {getTotalItems()}
            </Typography>
            <Typography variant="h5" color="primary">
              Total: ₹{getTotalPrice()}
            </Typography>
          </Box>

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handlePlaceOrder}
            disabled={loading}
            sx={{ mb: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Place Order'}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            onClick={() => navigate('/')}
          >
            Continue Shopping
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Cart;
