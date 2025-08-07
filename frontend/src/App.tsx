import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Components
import Navbar from './components/Navbar';
import Menu from './components/Menu';
import Cart from './components/Cart';
import Login from './components/Login';
import Signup from './components/Signup';
import Profile from './components/Profile';
import Dashboard from './components/Dashboard';
import TableManagement from './components/TableManagement';
import FloorManagement from './components/FloorManagement';
import StaffManagement from './components/StaffManagement';
import MenuManagement from './components/MenuManagement';
import RoomManagement from './components/RoomManagement';
import StaffPortal from './components/StaffPortal';
import AdminHR from './components/AdminHR';
import OrderManagement from './components/OrderManagement';
import MyOrders from './components/MyOrders';
import Reviews from './components/Reviews';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#d32f2f',
    },
    secondary: {
      main: '#ff9800',
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/reviews" element={<Reviews />} />
        
        {/* Admin routes */}
        <Route 
          path="/dashboard" 
          element={user?.is_superuser || user?.cafe_manager ? <Dashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/manage-tables" 
          element={user?.is_superuser || user?.cafe_manager ? <TableManagement /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/manage-floors" 
          element={user?.is_superuser || user?.cafe_manager ? <FloorManagement /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/manage-staff" 
          element={user?.is_superuser || user?.cafe_manager ? <StaffManagement /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/manage-menu" 
          element={user?.is_superuser || user?.cafe_manager ? <MenuManagement /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/manage-rooms" 
          element={user?.is_superuser || user?.cafe_manager ? <RoomManagement /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/staff-portal" 
          element={<StaffPortal />} 
        />
        <Route 
          path="/admin-hr" 
          element={user?.is_superuser || user?.cafe_manager ? <AdminHR /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/manage-orders" 
          element={user?.is_superuser || user?.cafe_manager ? <OrderManagement /> : <Navigate to="/login" />} 
        />
      </Routes>
    </>
  );
};

export default App;
