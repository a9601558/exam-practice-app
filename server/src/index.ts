import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/db';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Import models to ensure they are initialized
import './models';

// Import routes (will create these next)
import userRoutes from './routes/userRoutes';
import questionSetRoutes from './routes/questionSetRoutes';
import purchaseRoutes from './routes/purchaseRoutes';
import redeemCodeRoutes from './routes/redeemCodeRoutes';

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Security middleware
app.use(helmet());

// Rate limit configuration
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  standardHeaders: true,
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  }
});

// Login attempt limit
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 login attempts per IP
  standardHeaders: true,
  message: {
    success: false,
    message: '登录尝试次数过多，请稍后再试'
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Apply global rate limit
app.use(generalLimiter);

// Routes
app.use('/api/users/login', loginLimiter); // Login route extra restriction
app.use('/api/users', userRoutes);
app.use('/api/question-sets', questionSetRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/redeem-codes', redeemCodeRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: '欢迎使用在线考试练习系统API' });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `找不到路径 - ${req.originalUrl}`
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';
  
  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`服务器以 ${process.env.NODE_ENV} 模式运行，端口 ${PORT}`);
});

export default app; 