import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/authRoutes';
import transactionRoutes from './routes/transactionRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import { rateLimit } from './middlewares/rateLimitMiddleware';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Configure CORS with allowed origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.use(express.json({ limit: '10kb' })); // Limit payload size

// Apply rate limiting to auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 requests per window
});

app.use('/auth', authLimiter, authRoutes);
app.use('/users', authLimiter, authRoutes); // Exposing /users/me via authRoutes (cleaner alias)
app.use('/transactions', transactionRoutes);
app.use('/dashboard', dashboardRoutes);

// Basic Health Check
app.get('/', (req, res) => {
    res.json({ message: 'Personal Expense Tracker API is running' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export { app, prisma };
