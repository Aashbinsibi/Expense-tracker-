import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/authRoutes';
import transactionRoutes from './routes/transactionRoutes';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/users', authRoutes); // Exposing /users/me via authRoutes (cleaner alias)
app.use('/transactions', transactionRoutes);

// Basic Health Check
app.get('/', (req, res) => {
    res.json({ message: 'Personal Expense Tracker API is running' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export { app, prisma };
