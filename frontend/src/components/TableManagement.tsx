import React, { useState, useEffect, useCallback } from 'react';
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
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ViewModule as GridIcon,
  ViewComfy as VisualIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { Table, Floor } from '../types';

const TableManagement: React.FC = () => {
  const { user } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'visual'>('grid');
  
  // Floor management state
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  
  const [newTable, setNewTable] = useState({
    table_number: '',
    table_name: '',
    capacity: 4,
    floor: 1, // Default to first floor
  });

  // Visual arrangement state
  const [visualTables, setVisualTables] = useState<Array<Table & { x: number; y: number }>>([]);
  const [draggedTable, setDraggedTable] = useState<Table | null>(null);

  const loadFloors = useCallback(async () => {
    try {
      const floorsData = await apiService.getFloors();
      setFloors(floorsData);
      if (floorsData.length > 0 && !selectedFloor) {
        setSelectedFloor(floorsData[0].id);
      }
    } catch (error: any) {
      console.error('Failed to load floors:', error);
    }
  }, [selectedFloor]);

  useEffect(() => {
    loadTables();
    loadFloors();
  }, [loadFloors]);

  useEffect(() => {
    if (viewMode === 'visual') {
      setVisualTables(tables.map(table => ({
        ...table,
        x: table.visual_x || 0,
        y: table.visual_y || 0,
      })));
    }
  }, [tables, viewMode, visualTables.length]);

  useEffect(() => {
    // Initialize visual tables with saved positions or default positions
    if (tables.length > 0 && visualTables.length === 0) {
      const initialVisualTables = tables.map((table, index) => ({
        ...table,
        x: table.visual_x || (index % 4) * 200 + 50,
        y: table.visual_y || Math.floor(index / 4) * 150 + 50,
      }));
      setVisualTables(initialVisualTables);
    }
  }, [tables]);

  useEffect(() => {
    // Update newTable floor when selectedFloor changes
    if (selectedFloor) {
      setNewTable(prev => ({ ...prev, floor: selectedFloor }));
    }
  }, [selectedFloor]);

  const loadTables = async () => {
    try {
      const tablesData = await apiService.getTables();
      setTables(tablesData);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const filteredTables = selectedFloor 
    ? tables.filter(table => table.floor === selectedFloor)
    : tables;

  const handleViewModeChange = (event: React.MouseEvent<HTMLElement>, newMode: 'grid' | 'visual' | null) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const handleDragStart = (e: React.DragEvent, table: Table) => {
    setDraggedTable(table);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedTable) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setVisualTables(prev => 
      prev.map(table => 
        table.id === draggedTable.id 
          ? { ...table, x, y }
          : table
      )
    );

    // Save position to backend
    try {
      await apiService.updateTablePosition(draggedTable.id, x, y);
    } catch (error) {
      console.error('Failed to save table position:', error);
    }

    setDraggedTable(null);
  };

  const handleCreateTable = async () => {
    if (!newTable.table_number.trim()) {
      setError('Table number is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const tableData = {
        table_number: newTable.table_number,
        table_name: newTable.table_name || '',
        capacity: newTable.capacity,
        floor: newTable.floor,
      };

      await apiService.createTable(tableData);
      setSuccess('Table created successfully!');
      setOpenDialog(false);
      setNewTable({ table_number: '', table_name: '', capacity: 4, floor: selectedFloor || 1 });
      loadTables();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create table');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateQR = async (tableId: number) => {
    setLoading(true);
    setError('');

    try {
      await apiService.regenerateQR(tableId);
      setSuccess('QR code regenerated successfully!');
      loadTables();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to regenerate QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTable = async (tableId: number) => {
    if (!window.confirm('Are you sure you want to delete this table? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiService.deleteTable(tableId);
      setSuccess('Table deleted successfully!');
      loadTables();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete table');
    } finally {
      setLoading(false);
    }
  };

  const VisualArrangement: React.FC = () => (
    <Box sx={{ mt: 2 }}>
      <Paper 
        sx={{ 
          position: 'relative', 
          width: '100%', 
          height: '600px', 
          bgcolor: '#f8f9fa',
          border: '2px dashed #dee2e6',
          overflow: 'hidden',
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Restaurant floor plan elements */}
        <Box sx={{ 
          position: 'absolute', 
          top: 20, 
          left: 20, 
          bgcolor: '#e3f2fd', 
          p: 1, 
          borderRadius: 1,
          fontSize: '0.8rem',
          color: '#1976d2'
        }}>
          🍽️ Restaurant Floor Plan
        </Box>
        
        {visualTables.map((table) => (
          <Box
            key={table.id}
            draggable
            onDragStart={(e) => handleDragStart(e, table)}
            sx={{
              position: 'absolute',
              left: table.x,
              top: table.y,
              width: 120,
              height: 80,
              bgcolor: table.has_active_order ? '#f44336' : (table.is_active ? '#4caf50' : '#f44336'),
              color: 'white',
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'move',
              boxShadow: 2,
              border: '2px solid rgba(255,255,255,0.3)',
              '&:hover': {
                boxShadow: 4,
                transform: 'scale(1.05)',
                zIndex: 10,
              },
              transition: 'all 0.2s ease-in-out',
              userSelect: 'none',
            }}
          >
            <DragIcon sx={{ fontSize: 16, mb: 0.5, opacity: 0.7 }} />
            <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
              {table.table_number}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.9 }}>
              {table.table_name || 'Table'}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.8 }}>
              {table.capacity} seats
            </Typography>
            {table.has_active_order && (
              <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.9, fontWeight: 'bold' }}>
                OCCUPIED
              </Typography>
            )}
          </Box>
        ))}
      </Paper>
      
      <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary">
          💡 Drag tables to rearrange them visually • Green = Active, Red = Inactive
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            const resetTables = tables.map((table, index) => ({
              ...table,
              x: (index % 4) * 200 + 50,
              y: Math.floor(index / 4) * 150 + 50,
            }));
            setVisualTables(resetTables);
          }}
        >
          Reset Layout
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={async () => {
            try {
              // Save all current positions
              for (const table of visualTables) {
                await apiService.updateTablePosition(table.id, table.x, table.y);
              }
              setSuccess('Layout saved successfully!');
            } catch (error) {
              setError('Failed to save layout');
            }
          }}
        >
          Save Layout
        </Button>
      </Box>
    </Box>
  );

  if (!user?.is_superuser && !user?.cafe_manager) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1">
            Table Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {filteredTables.filter(t => t.has_active_order).length} of {filteredTables.length} tables occupied
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 12, height: 12, bgcolor: '#4caf50', borderRadius: 1 }} />
              <Typography variant="caption">Available</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 12, height: 12, bgcolor: '#f44336', borderRadius: 1 }} />
              <Typography variant="caption">Occupied</Typography>
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {floors.length > 0 && (
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Select Floor</InputLabel>
              <Select
                value={selectedFloor || ''}
                label="Select Floor"
                onChange={(e) => setSelectedFloor(e.target.value as number)}
              >
                {floors.map((floor) => (
                  <MenuItem key={floor.id} value={floor.id}>
                    {floor.name} ({floor.table_count || 0} tables)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
          >
            <ToggleButton value="grid">
              <GridIcon sx={{ mr: 1 }} />
              Grid View
            </ToggleButton>
            <ToggleButton value="visual">
              <VisualIcon sx={{ mr: 1 }} />
              Visual Layout
            </ToggleButton>
          </ToggleButtonGroup>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            ADD NEW TABLE
          </Button>
        </Box>
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
      ) : viewMode === 'visual' ? (
        <VisualArrangement />
      ) : (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: 3 
        }}>
          {filteredTables.map((table) => (
            <Card 
              key={table.id}
              sx={{
                border: table.has_active_order ? '2px solid #f44336' : '1px solid #e0e0e0',
                backgroundColor: table.has_active_order ? '#ffebee' : 'white',
                '&:hover': {
                  backgroundColor: table.has_active_order ? '#ffcdd2' : '#f5f5f5',
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" component="h2" sx={{ color: table.has_active_order ? '#d32f2f' : 'inherit' }}>
                      {table.table_number}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {table.table_name || 'Table'}
                    </Typography>
                    {table.has_active_order && (
                      <Chip
                        label="OCCUPIED"
                        color="error"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Box>
                  <Chip
                    label={table.is_active ? 'Active' : 'Inactive'}
                    color={table.is_active ? 'success' : 'error'}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" sx={{ mb: 2 }}>
                  Capacity: {table.capacity} people
                </Typography>

                {table.qr_code_url && (
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <img
                      src={table.qr_code_url}
                      alt={`QR Code for Table ${table.table_number}`}
                      style={{ maxWidth: '100px', height: 'auto', cursor: 'pointer' }}
                      onClick={() => {
                        const url = `http://localhost:3002/?table=${table.qr_unique_id}`;
                        navigator.clipboard.writeText(url);
                        setSuccess('QR code URL copied to clipboard!');
                      }}
                      title="Click to copy QR code URL"
                    />
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      QR Code (Click to copy URL)
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1, wordBreak: 'break-all' }}>
                      URL: http://localhost:3002/?table={table.qr_unique_id}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleRegenerateQR(table.id)}
                    title="Regenerate QR Code"
                    disabled={loading}
                  >
                    <RefreshIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteTable(table.id)}
                    title="Delete Table"
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

      {/* Create Table Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Table</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Table Number"
            value={newTable.table_number}
            onChange={(e) => setNewTable({ ...newTable, table_number: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Table Name (Optional)"
            value={newTable.table_name}
            onChange={(e) => setNewTable({ ...newTable, table_name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Capacity"
            type="number"
            value={newTable.capacity}
            onChange={(e) => setNewTable({ ...newTable, capacity: parseInt(e.target.value) || 4 })}
            margin="normal"
            inputProps={{ min: 1, max: 20 }}
          />
          {floors.length > 0 && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Floor</InputLabel>
              <Select
                value={newTable.floor}
                label="Floor"
                onChange={(e) => setNewTable({ ...newTable, floor: e.target.value as number })}
              >
                {floors.map((floor) => (
                  <MenuItem key={floor.id} value={floor.id}>
                    {floor.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateTable} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Create Table'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TableManagement;
