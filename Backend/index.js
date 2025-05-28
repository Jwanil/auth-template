import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser'; // Add this import
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';  // Changed to import

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true // Important for cookies to work cross-origin
}));
app.use(express.json());
app.use(cookieParser()); // Add this middleware

// Routes
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Use routes
app.use('/api/users', userRoutes);

// Start server
const PORT = process.env.PORT || 5010; // Changed fallback port to 5010
let server;

const startServer = (port) => {
  server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  }).on('error', (err) => {
    // Removed port increment logic
    console.error(`Server failed to start on port ${port}:`, err.message); // Log a clean error
    // You can add process.exit(1) here if you want the app to exit on port conflict
  });
};

startServer(PORT);