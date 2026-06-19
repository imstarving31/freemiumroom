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
const mongoose = require('mongoose');
const roomPostRoutes = require('./src/routes/roomPost.route');
const authRoutes = require('./src/routes/auth.route');
const categoryRoutes = require('./src/routes/category.route');
const userRoutes = require('./src/routes/user.route');
const paymentRoutes = require('./src/routes/payment.route');
const adminRoutes = require('./src/routes/admin.route');
const statisticRoutes = require('./src/routes/statistic.route');
const chatbotRoutes = require('./src/routes/chatbot.route');
const chatbotAdminRoutes = require('./src/routes/chatbot.admin.route');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB().then(async () => {
  try {
    console.log('--- DB MIGRATION CHECK START ---');
    const db = mongoose.connection.db;
    
    // 1. Rename categoryId -> categoryID in RoomPost
    const roomPostResult = await db.collection('roomposts').updateMany(
      { categoryId: { $exists: true } },
      { $rename: { categoryId: 'categoryID' } }
    );
    if (roomPostResult.modifiedCount > 0) {
      console.log(`Migrated ${roomPostResult.modifiedCount} RoomPost documents (categoryId -> categoryID).`);
    }

    // 2. Rename userId -> userID in Transaction
    const txnResult = await db.collection('transactions').updateMany(
      { userId: { $exists: true } },
      { $rename: { userId: 'userID' } }
    );
    if (txnResult.modifiedCount > 0) {
      console.log(`Migrated ${txnResult.modifiedCount} Transaction documents (userId -> userID).`);
    }

    // 3. Rename userId -> userID in ChatSession
    const chatSessionResult = await db.collection('chatsessions').updateMany(
      { userId: { $exists: true } },
      { $rename: { userId: 'userID' } }
    );
    if (chatSessionResult.modifiedCount > 0) {
      console.log(`Migrated ${chatSessionResult.modifiedCount} ChatSession documents (userId -> userID).`);
    }

    console.log('--- DB MIGRATION CHECK COMPLETE ---');
  } catch (err) {
    console.error('Migration error:', err);
  }
});

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
app.use('/api/stats', statisticRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/admin/chatbot', chatbotAdminRoutes);


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
