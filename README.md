# 🍽️ Digital QR Food Ordering System

A modern, full-stack food ordering system with QR code-based table management, real-time order tracking, and comprehensive billing system.

## ✨ Features

### 🍕 Customer Features
- **QR Code Ordering**: Scan QR codes to access restaurant menu
- **Anonymous Ordering**: Order without creating an account
- **Real-time Order Tracking**: Track order status in real-time
- **Modern UI/UX**: Beautiful, responsive interface
- **Cart Management**: Add/remove items with persistent cart
- **Bill Portal**: View and print detailed bills
- **Multiple Orders**: Place multiple orders from same table

### 🏢 Restaurant Management
- **Table Management**: Visual table arrangement with drag & drop
- **Floor Management**: Organize tables by floors
- **Room Management**: Hotel room ordering system
- **Order Management**: Real-time order status updates
- **Menu Management**: Add/edit menu items with images
- **Staff Management**: Complete HR system with attendance tracking
- **Analytics Dashboard**: Revenue, orders, and performance metrics

### 🏨 Hotel Features
- **Room QR Codes**: Unique QR codes for each hotel room
- **Room Status**: Track room availability and occupancy
- **In-room Ordering**: Guests can order food to their rooms

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Order-food-using-QR_code
```

2. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

3. **Install Node.js dependencies**
```bash
cd frontend
npm install
cd ..
```

4. **Run database migrations**
```bash
python manage.py migrate
```

5. **Create superuser (optional)**
```bash
python manage.py createsuperuser
```

## 🌐 Running the Application

### Method 1: Dynamic IP Detection (Recommended)
```bash
./start_dynamic.sh
```

This will:
- **Automatically detect your current IP address**
- Start both backend and frontend servers
- Bind to all network interfaces (accessible from other devices)
- Display your detected IP address
- Show access URLs
- **Works on any WiFi network without configuration changes**

### Method 2: Quick Start Script (Legacy)
```bash
./start_servers.sh
```

This will:
- Start both backend and frontend servers
- Bind to all network interfaces (accessible from other devices)
- Display your local IP address
- Show access URLs

### Method 2: Manual Start

**Backend (Django)**
```bash
python manage.py runserver 0.0.0.0:8002
```

**Frontend (React)**
```bash
cd frontend
HOST=0.0.0.0 npm start
```

## 📱 Access URLs

Once running, you can access the application from:

### Local Access
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8002
- **Admin Panel**: http://localhost:8002/admin

### Network Access (Other Devices)
- **Frontend**: http://YOUR_IP:3000
- **Backend API**: http://YOUR_IP:8002
- **Admin Panel**: http://YOUR_IP:8002/admin

**🔄 Dynamic IP Detection**: The app automatically detects your current IP address and works on any WiFi network without manual configuration.

## 🔗 QR Code URLs

QR codes are automatically generated for each table/room with URLs like:
- **Table**: `http://YOUR_IP:3000/?table=TABLE_UNIQUE_ID`
- **Room**: `http://YOUR_IP:3000/?room=ROOM_UNIQUE_ID`

**🔄 Dynamic QR Codes**: QR codes automatically use your current IP address and work on any WiFi network.

## 🛠️ API Endpoints

### Public Endpoints (No Authentication Required)
- `GET /api/menu/` - Get menu items
- `GET /api/tables/` - Get tables with status
- `GET /api/rooms/` - Get hotel rooms
- `POST /api/orders/` - Create orders
- `GET /api/bills/` - View bills
- `POST /api/orders/clear_table/` - Clear table
- `GET /api/orders/{id}/` - Get order details

### Admin Endpoints (Authentication Required)
- `GET /api/dashboard/stats/` - Dashboard statistics
- `POST /api/menu/` - Create menu items
- `PUT /api/menu/{id}/` - Update menu items
- `DELETE /api/menu/{id}/` - Delete menu items
- `GET /api/staff/` - Staff management
- `GET /api/attendance/` - Attendance tracking

## 📊 Database Models

### Core Models
- **User**: Customer and staff accounts
- **Table**: Restaurant tables with QR codes
- **Room**: Hotel rooms with QR codes
- **Floor**: Building floors
- **MenuItem**: Food items with categories
- **Order**: Customer orders with status tracking
- **Bill**: Generated bills for orders
- **Staff**: Employee management
- **Attendance**: Staff attendance tracking
- **Leave**: Leave management system

## 🎨 Frontend Features

### Technologies Used
- **React 18** with TypeScript
- **Material-UI** for modern UI components
- **React Router** for navigation
- **Axios** for API communication
- **Local Storage** for cart persistence

### Key Components
- **Menu**: Display menu items with cart functionality
- **Cart**: Order review and checkout
- **OrderTracking**: Real-time order status
- **BillPortal**: View and print bills
- **TableManagement**: Visual table arrangement
- **StaffPortal**: Staff self-service portal
- **AdminHR**: HR management interface

## 🔧 Configuration

### Dynamic IP Detection
The application automatically detects your current IP address and works on any WiFi network:

- **Backend**: Automatically uses current IP for CORS and QR codes
- **Frontend**: Dynamically connects to backend using same host
- **QR Codes**: Generated with current IP address
- **No Manual Configuration**: Works on any network without changes

### Backend Settings (`pr1/settings.py`)
- **ALLOWED_HOSTS**: Configured for network access
- **CORS**: Cross-origin requests enabled with dynamic IP
- **Media Files**: QR codes and images served
- **Database**: SQLite (can be changed to PostgreSQL/MySQL)
- **Dynamic IP**: Automatically detected and used

### Frontend Settings (`frontend/src/services/api.ts`)
- **API Base URL**: Dynamically detected from current host
- **CORS**: Enabled for cross-origin requests
- **Network Agnostic**: Works on any WiFi network

## 🧪 Testing

### Backend Testing
```bash
python manage.py test
```

### Frontend Testing
```bash
cd frontend
npm test
```

### Manual Testing
1. **QR Code Testing**: Scan table/room QR codes
2. **Order Flow**: Add items → Cart → Checkout → Track
3. **Admin Functions**: Manage tables, menu, staff
4. **Billing**: View and print bills
5. **Multi-device**: Test on mobile, tablet, desktop

## 🚨 Troubleshooting

### Common Issues

**1. Port Already in Use**
```bash
# Kill existing processes
pkill -f "python manage.py runserver"
pkill -f "npm start"
```

**2. CORS Errors**
- Ensure backend is running on `0.0.0.0:8002`
- Check CORS settings in `pr1/settings.py`

**3. Network Access Issues**
- Verify firewall settings
- Check if devices are on same network
- Use `ifconfig` to get correct IP address

**4. QR Code Issues**
- Ensure QR codes are generated for tables/rooms
- Check media file serving in Django

### Debug Commands
```bash
# Check server status
curl http://localhost:8002/api/menu/
curl http://localhost:3000

# Check network access
curl http://YOUR_IP:8002/api/menu/
curl http://YOUR_IP:3000

# View logs
tail -f /var/log/django.log
```

## 📈 Performance

### Optimization Tips
- **Images**: Compress menu item images
- **QR Codes**: Generate on-demand, not all at once
- **Database**: Use PostgreSQL for production
- **Caching**: Implement Redis for session storage
- **CDN**: Use CDN for static files in production

## 🔒 Security

### Production Checklist
- [ ] Change `DEBUG = False`
- [ ] Use environment variables for secrets
- [ ] Configure HTTPS
- [ ] Set up proper CORS origins
- [ ] Use production database (PostgreSQL/MySQL)
- [ ] Configure proper logging
- [ ] Set up backup system

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

---

**🎉 Enjoy your Digital QR Food Ordering System!**



