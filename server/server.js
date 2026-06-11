require('dotenv').config();
console.log('--- VNPAY ENVIRONMENT VARIABLES STARTUP CHECK ---');
console.log('VNP_TMNCODE:', process.env.VNP_TMNCODE);
console.log('VNP_HASHSECRET:', process.env.VNP_HASHSECRET);
console.log('--------------------------------------------------');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./src/config/db');
const roomPostRoutes = require('./src/routes/roomPost.route');
const authRoutes = require('./src/routes/auth.route');
const categoryRoutes = require('./src/routes/category.route');
const userRoutes = require('./src/routes/user.route');
const paymentRoutes = require('./src/routes/payment.route');
const adminRoutes = require('./src/routes/admin.route');
const statisticRoutes = require('./src/routes/statistic.route');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/room-posts', roomPostRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/statistics', statisticRoutes);


// Root route
app.get('/', (req, res) => {
  res.send('FreemiumRoom API is running...');
});

// Create HTTP Server and attach Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Attach socket.io instance to app for reference in controllers
app.set('socketio', io);

// Start Server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = { app, server, io };
