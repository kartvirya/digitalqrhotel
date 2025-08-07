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
  IconButton
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { MenuItem, Table } from '../types';
import { apiService } from '../services/api';

const Menu: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tableInfo, setTableInfo] = useState<Table | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, { quantity: number; name: string; price: number }>>({});

  const tableUniqueId = searchParams.get('table');
  const roomUniqueId = searchParams.get('room');

  useEffect(() => {
    loadMenu();
    if (tableUniqueId) {
      loadTableInfo();
    } else if (roomUniqueId) {
      loadRoomInfo();
    }
  }, [tableUniqueId, roomUniqueId]); // eslint-disable-line react-hooks/exhaustive-deps

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
      if (table) {
        setTableInfo(table);
      }
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
          table_number: room.room_number,
          table_name: room.room_name || `Room ${room.room_number}`,
          capacity: room.capacity,
          is_active: room.is_active,
          qr_unique_id: room.qr_unique_id,
          floor: room.floor,
          floor_name: room.floor_name,
          created_at: room.created_at,
          qr_code: room.qr_code,
          qr_code_url: room.qr_code_url,
          visual_x: 0,
          visual_y: 0,
          has_active_order: room.has_active_order
        });
      }
    } catch (error) {
      console.error('Failed to load room info:', error);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev[item.id];
      if (existing) {
        return {
          ...prev,
          [item.id]: {
            ...existing,
            quantity: existing.quantity + 1,
          },
        };
      } else {
        return {
          ...prev,
          [item.id]: {
            quantity: 1,
            name: item.name,
            price: item.price,
          },
        };
      }
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => {
      const existing = prev[itemId];
      if (existing && existing.quantity > 1) {
        return {
          ...prev,
          [itemId]: {
            ...existing,
            quantity: existing.quantity - 1,
          },
        };
      } else {
        const newCart = { ...prev };
        delete newCart[itemId];
        return newCart;
      }
    });
  };

  const getCartItemQuantity = (itemId: number) => {
    return cart[itemId]?.quantity || 0;
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((total, item) => total + item.quantity, 0);
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  // Group items by category
  const itemsByCategory = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Table Info Alert */}
      {tableInfo && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6">
            Welcome to Table {tableInfo.table_number}
          </Typography>
          {tableInfo.table_name && (
            <Typography variant="body2">
              Table Name: {tableInfo.table_name}
            </Typography>
          )}
          <Typography variant="body2">
            Capacity: {tableInfo.capacity} people
          </Typography>
          <Typography variant="body2">
            Scan this QR code to order directly from your table!
          </Typography>
        </Alert>
      )}

      {/* Menu Items */}
      {Object.entries(itemsByCategory).map(([category, items]) => (
        <Box key={category} sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ mb: 2, textTransform: 'capitalize' }}>
            {category}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
            {items.map((item) => (
              <Card key={item.id}>
                <CardMedia
                  component="img"
                  height="200"
                  image={item.image_url}
                  alt={item.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {item.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {item.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="primary">
                      ₹{item.price}
                    </Typography>
                    <Chip label={item.category} size="small" />
                  </Box>
                  
                  {/* Cart Controls */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getCartItemQuantity(item.id) > 0 && (
                      <IconButton
                        size="small"
                        onClick={() => removeFromCart(item.id)}
                        color="primary"
                      >
                        <RemoveIcon />
                      </IconButton>
                    )}
                    
                    {getCartItemQuantity(item.id) > 0 && (
                      <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center' }}>
                        {getCartItemQuantity(item.id)}
                      </Typography>
                    )}
                    
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => addToCart(item)}
                      fullWidth
                    >
                      Add to Cart
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      ))}

      {/* Cart Summary */}
      {getTotalItems() > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000,
          }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={() => window.location.href = '/cart'}
            sx={{ borderRadius: 2 }}
          >
            View Cart ({getTotalItems()} items)
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default Menu;
