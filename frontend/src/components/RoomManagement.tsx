import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem as MuiMenuItem,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  QrCode as QrCodeIcon,
  Hotel as HotelIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';
import { Room, Floor } from '../types';

const RoomManagement: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [success, setSuccess] = useState<string>('');
  const [error, setError] = useState<string>('');

  const [newRoom, setNewRoom] = useState({
    room_number: '',
    room_name: '',
    room_type: 'single',
    floor: 1,
    capacity: 2,
    price_per_night: '',
    room_status: 'available',
    description: '',
    amenities: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [roomsData, floorsData] = await Promise.all([
        apiService.getRooms(),
        apiService.getFloors()
      ]);
      setRooms(roomsData);
      setFloors(floorsData);
    } catch (error) {
      setError('Failed to load rooms and floors');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    try {
      const roomData = {
        ...newRoom,
        price_per_night: newRoom.price_per_night,
        floor: newRoom.floor
      };
      
      await apiService.createRoom(roomData);
      setSuccess('Room created successfully!');
      setOpenDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      setError('Failed to create room');
    }
  };

  const handleUpdateRoom = async () => {
    if (!editingRoom) return;
    
    try {
      const roomData = {
        ...newRoom,
        price_per_night: newRoom.price_per_night,
        floor: newRoom.floor
      };
      
      await apiService.updateRoom(editingRoom.id, roomData);
      setSuccess('Room updated successfully!');
      setOpenDialog(false);
      setEditingRoom(null);
      resetForm();
      loadData();
    } catch (error) {
      setError('Failed to update room');
    }
  };

  const handleDeleteRoom = async (roomId: number) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await apiService.deleteRoom(roomId);
        setSuccess('Room deleted successfully!');
        loadData();
      } catch (error) {
        setError('Failed to delete room');
      }
    }
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setNewRoom({
      room_number: room.room_number,
      room_name: room.room_name || '',
      room_type: room.room_type,
      floor: room.floor,
      capacity: room.capacity,
      price_per_night: room.price_per_night,
      room_status: room.room_status,
      description: room.description || '',
      amenities: room.amenities || ''
    });
    setOpenDialog(true);
  };

  const resetForm = () => {
    setNewRoom({
      room_number: '',
      room_name: '',
      room_type: 'single',
      floor: 1,
      capacity: 2,
      price_per_night: '',
      room_status: 'available',
      description: '',
      amenities: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success';
      case 'occupied': return 'error';
      case 'maintenance': return 'warning';
      case 'reserved': return 'info';
      case 'cleaning': return 'default';
      default: return 'default';
    }
  };

  const getRoomTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'single': 'Single Room',
      'double': 'Double Room',
      'triple': 'Triple Room',
      'suite': 'Suite',
      'deluxe': 'Deluxe Room',
      'presidential': 'Presidential Suite'
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography>Loading rooms...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1">
            Room Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {rooms.filter(r => r.room_status === 'occupied').length} of {rooms.length} rooms occupied
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingRoom(null);
            resetForm();
            setOpenDialog(true);
          }}
        >
          Add Room
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
        {rooms.map((room) => (
          <Box key={room.id}>
            <Card 
              sx={{
                border: room.has_active_order ? '2px solid #f44336' : '1px solid #e0e0e0',
                backgroundColor: room.has_active_order ? '#ffebee' : 'white',
                '&:hover': {
                  backgroundColor: room.has_active_order ? '#ffcdd2' : '#f5f5f5',
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" component="h2" sx={{ color: room.has_active_order ? '#d32f2f' : 'inherit' }}>
                      Room {room.room_number}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {room.room_name || getRoomTypeLabel(room.room_type)}
                    </Typography>
                    {room.has_active_order && (
                      <Chip
                        label="HAS ORDER"
                        color="error"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Box>
                  <Chip
                    label={room.room_status.toUpperCase()}
                    color={getStatusColor(room.room_status) as any}
                    size="small"
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <HotelIcon sx={{ mr: 1, fontSize: 'small' }} />
                  <Typography variant="body2">
                    {getRoomTypeLabel(room.room_type)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PersonIcon sx={{ mr: 1, fontSize: 'small' }} />
                  <Typography variant="body2">
                    {room.capacity} guests
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <MoneyIcon sx={{ mr: 1, fontSize: 'small' }} />
                  <Typography variant="body2">
                    ${room.price_per_night}/night
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Floor: {room.floor_name || `Floor ${room.floor}`}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Tooltip title="Edit Room">
                      <IconButton
                        size="small"
                        onClick={() => handleEditRoom(room)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Room">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteRoom(room.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  {room.qr_code_url && (
                    <Tooltip title="View QR Code">
                      <IconButton
                        size="small"
                        onClick={() => {
                          const url = `http://localhost:3002/?room=${room.qr_unique_id}`;
                          navigator.clipboard.writeText(url);
                          setSuccess('Room QR code URL copied to clipboard!');
                        }}
                      >
                        <QrCodeIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Add/Edit Room Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRoom ? 'Edit Room' : 'Add New Room'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 1 }}>
            <Box>
              <TextField
                fullWidth
                label="Room Number"
                value={newRoom.room_number}
                onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })}
                margin="normal"
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Room Name"
                value={newRoom.room_name}
                onChange={(e) => setNewRoom({ ...newRoom, room_name: e.target.value })}
                margin="normal"
              />
            </Box>
            <Box>
              <FormControl fullWidth margin="normal">
                <InputLabel>Room Type</InputLabel>
                <Select
                  value={newRoom.room_type}
                  onChange={(e) => setNewRoom({ ...newRoom, room_type: e.target.value })}
                >
                  <MuiMenuItem value="single">Single Room</MuiMenuItem>
                  <MuiMenuItem value="double">Double Room</MuiMenuItem>
                  <MuiMenuItem value="triple">Triple Room</MuiMenuItem>
                  <MuiMenuItem value="suite">Suite</MuiMenuItem>
                  <MuiMenuItem value="deluxe">Deluxe Room</MuiMenuItem>
                  <MuiMenuItem value="presidential">Presidential Suite</MuiMenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box>
              <FormControl fullWidth margin="normal">
                <InputLabel>Floor</InputLabel>
                <Select
                  value={newRoom.floor}
                  onChange={(e) => setNewRoom({ ...newRoom, floor: e.target.value as number })}
                >
                  {floors.map((floor) => (
                    <MuiMenuItem key={floor.id} value={floor.id}>
                      {floor.name}
                    </MuiMenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Capacity"
                type="number"
                value={newRoom.capacity}
                onChange={(e) => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) || 1 })}
                margin="normal"
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Price per Night"
                type="number"
                value={newRoom.price_per_night}
                onChange={(e) => setNewRoom({ ...newRoom, price_per_night: e.target.value })}
                margin="normal"
              />
            </Box>
            <Box>
              <FormControl fullWidth margin="normal">
                <InputLabel>Room Status</InputLabel>
                <Select
                  value={newRoom.room_status}
                  onChange={(e) => setNewRoom({ ...newRoom, room_status: e.target.value })}
                >
                  <MuiMenuItem value="available">Available</MuiMenuItem>
                  <MuiMenuItem value="occupied">Occupied</MuiMenuItem>
                  <MuiMenuItem value="maintenance">Under Maintenance</MuiMenuItem>
                  <MuiMenuItem value="reserved">Reserved</MuiMenuItem>
                  <MuiMenuItem value="cleaning">Being Cleaned</MuiMenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={newRoom.description}
                onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                margin="normal"
              />
            </Box>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField
                fullWidth
                label="Amenities (comma separated)"
                value={newRoom.amenities}
                onChange={(e) => setNewRoom({ ...newRoom, amenities: e.target.value })}
                margin="normal"
                placeholder="WiFi, TV, AC, Mini Bar"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={editingRoom ? handleUpdateRoom : handleCreateRoom}
            variant="contained"
          >
            {editingRoom ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Messages */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
      >
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RoomManagement;
