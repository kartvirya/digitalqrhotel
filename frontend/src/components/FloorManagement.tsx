import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Box,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { Floor } from '../types';

const FloorManagement: React.FC = () => {
  const { user } = useAuth();
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [newFloor, setNewFloor] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    loadFloors();
  }, []);

  const loadFloors = async () => {
    try {
      const floorsData = await apiService.getFloors();
      setFloors(floorsData);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load floors');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFloor = async () => {
    if (!newFloor.name.trim()) {
      setError('Floor name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiService.createFloor(newFloor);
      setSuccess('Floor created successfully!');
      setOpenDialog(false);
      setNewFloor({ name: '', description: '' });
      loadFloors();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create floor');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFloor = async () => {
    if (!editingFloor || !editingFloor.name.trim()) {
      setError('Floor name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiService.updateFloor(editingFloor.id, editingFloor);
      setSuccess('Floor updated successfully!');
      setOpenDialog(false);
      setEditingFloor(null);
      loadFloors();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update floor');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFloor = async (floorId: number) => {
    if (!window.confirm('Are you sure you want to delete this floor? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiService.deleteFloor(floorId);
      setSuccess('Floor deleted successfully!');
      loadFloors();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete floor');
    } finally {
      setLoading(false);
    }
  };

  const handleEditFloor = (floor: Floor) => {
    setEditingFloor(floor);
    setOpenDialog(true);
  };

  if (!user?.is_superuser && !user?.cafe_manager) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" color="error">
          Access Denied
        </Typography>
        <Typography variant="body1">
          You don't have permission to manage floors.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Floor Management
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingFloor(null);
            setNewFloor({ name: '', description: '' });
            setOpenDialog(true);
          }}
        >
          ADD NEW FLOOR
        </Button>
      </Box>

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

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: 3 
        }}>
          {floors.map((floor) => (
            <Card key={floor.id}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" component="h2">
                      {floor.name}
                    </Typography>
                    {floor.description && (
                      <Typography variant="body2" color="text.secondary">
                        {floor.description}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    label={floor.is_active ? 'Active' : 'Inactive'}
                    color={floor.is_active ? 'success' : 'error'}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" sx={{ mb: 2 }}>
                  Tables: {floor.table_count || 0}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleEditFloor(floor)}
                    title="Edit Floor"
                    disabled={loading}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteFloor(floor.id)}
                    title="Delete Floor"
                    disabled={loading}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Create/Edit Floor Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingFloor ? 'Edit Floor' : 'Add New Floor'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Floor Name"
            value={editingFloor ? editingFloor.name : newFloor.name}
            onChange={(e) => {
              if (editingFloor) {
                setEditingFloor({ ...editingFloor, name: e.target.value });
              } else {
                setNewFloor({ ...newFloor, name: e.target.value });
              }
            }}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description (Optional)"
            value={editingFloor ? editingFloor.description || '' : newFloor.description}
            onChange={(e) => {
              if (editingFloor) {
                setEditingFloor({ ...editingFloor, description: e.target.value });
              } else {
                setNewFloor({ ...newFloor, description: e.target.value });
              }
            }}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={editingFloor ? handleUpdateFloor : handleCreateFloor}
            variant="contained"
            disabled={loading}
          >
            {editingFloor ? 'Update Floor' : 'Create Floor'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FloorManagement;
