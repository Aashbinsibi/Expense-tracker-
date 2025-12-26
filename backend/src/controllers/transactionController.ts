import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/authMiddleware';

export const createTransaction = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { amount, type, categoryId, date, time, paymentMethod, note } = req.body;

        // Validation
        if (!amount || !type || !categoryId || !date || !paymentMethod) {
            res.status(400).json({ error: 'Amount, type, categoryId, date, and paymentMethod are required' });
            return;
        }

        if (!['expense', 'income'].includes(type)) {
            res.status(400).json({ error: 'Type must be either expense or income' });
            return;
        }

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            res.status(400).json({ error: 'Amount must be a positive number' });
            return;
        }

        if (!['cash', 'upi', 'card', 'wallet', 'other'].includes(paymentMethod)) {
            res.status(400).json({ error: 'Invalid payment method' });
            return;
        }

        // Verify category belongs to user
        const category = await prisma.category.findFirst({
            where: { id: categoryId, userId },
        });

        if (!category) {
            res.status(404).json({ error: 'Category not found or does not belong to this user' });
            return;
        }

        // Combine date and time
        let transactionAt = new Date(date);
        if (time) {
            const [hours, minutes] = time.split(':').map(Number);
            transactionAt.setHours(hours, minutes, 0, 0);
        }

        const transaction = await prisma.transaction.create({
            data: {
                userId,
                amount: amountNum,
                type,
                categoryId,
                paymentMethod,
                note: note || null,
                transactionAt,
            },
            include: { category: true },
        });

        res.status(201).json(transaction);
    } catch (error) {
        console.error('CreateTransaction error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Get user for timezone and month_start_day
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Parse query parameters
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 20));
        const filter = (req.query.filter as string) || 'current'; // 'current', 'previous', 'all'
        const sort = (req.query.sort as string) || 'newest'; // 'newest', 'oldest'

        // Calculate date range based on filter
        let dateRange = { gte: new Date(), lte: new Date() };

        if (filter === 'current' || filter === 'previous') {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();

            let monthStart: Date;
            let monthEnd: Date;

            if (filter === 'current') {
                // Calculate current month based on monthStartDay
                if (now.getDate() >= user.monthStartDay) {
                    monthStart = new Date(currentYear, currentMonth, user.monthStartDay);
                    monthEnd = new Date(currentYear, currentMonth + 1, user.monthStartDay - 1);
                } else {
                    monthStart = new Date(currentYear, currentMonth - 1, user.monthStartDay);
                    monthEnd = new Date(currentYear, currentMonth, user.monthStartDay - 1);
                }
            } else {
                // Previous month
                const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

                if (now.getDate() >= user.monthStartDay) {
                    monthStart = new Date(prevYear, prevMonth, user.monthStartDay);
                    monthEnd = new Date(currentYear, currentMonth, user.monthStartDay - 1);
                } else {
                    monthStart = new Date(prevYear, prevMonth - 1, user.monthStartDay);
                    monthEnd = new Date(prevYear, prevMonth, user.monthStartDay - 1);
                }
            }

            dateRange = { gte: monthStart, lte: monthEnd };
        }

        // Build where clause
        const where: any = {
            userId,
            deletedAt: null,
        };

        if (filter !== 'all') {
            where.transactionAt = dateRange;
        }

        // Get total count
        const total = await prisma.transaction.count({ where });

        // Get transactions with pagination
        const transactions = await prisma.transaction.findMany({
            where,
            include: { category: true },
            orderBy: {
                transactionAt: sort === 'newest' ? 'desc' : 'asc',
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        res.json({
            data: transactions,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    } catch (error) {
        console.error('GetTransactions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getTransactionById = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { id } = req.params;

        const transaction = await prisma.transaction.findFirst({
            where: { id, userId },
            include: { category: true },
        });

        if (!transaction) {
            res.status(404).json({ error: 'Transaction not found' });
            return;
        }

        res.json(transaction);
    } catch (error) {
        console.error('GetTransactionById error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateTransaction = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { id } = req.params;
        const { amount, type, categoryId, date, time, paymentMethod, note } = req.body;

        // Verify transaction belongs to user
        const transaction = await prisma.transaction.findFirst({
            where: { id, userId },
        });

        if (!transaction) {
            res.status(404).json({ error: 'Transaction not found' });
            return;
        }

        // Validate new values
        const updateData: any = {};

        if (amount !== undefined) {
            const amountNum = parseFloat(amount);
            if (isNaN(amountNum) || amountNum <= 0) {
                res.status(400).json({ error: 'Amount must be a positive number' });
                return;
            }
            updateData.amount = amountNum;
        }

        if (type !== undefined) {
            if (!['expense', 'income'].includes(type)) {
                res.status(400).json({ error: 'Type must be either expense or income' });
                return;
            }
            updateData.type = type;
        }

        if (categoryId !== undefined) {
            const category = await prisma.category.findFirst({
                where: { id: categoryId, userId },
            });
            if (!category) {
                res.status(404).json({ error: 'Category not found' });
                return;
            }
            updateData.categoryId = categoryId;
        }

        if (paymentMethod !== undefined) {
            if (!['cash', 'upi', 'card', 'wallet', 'other'].includes(paymentMethod)) {
                res.status(400).json({ error: 'Invalid payment method' });
                return;
            }
            updateData.paymentMethod = paymentMethod;
        }

        if (date !== undefined || time !== undefined) {
            let transactionAt = date ? new Date(date) : new Date(transaction.transactionAt);
            if (time) {
                const [hours, minutes] = time.split(':').map(Number);
                transactionAt.setHours(hours, minutes, 0, 0);
            }
            updateData.transactionAt = transactionAt;
        }

        if (note !== undefined) {
            updateData.note = note || null;
        }

        updateData.updatedAt = new Date();

        const updated = await prisma.transaction.update({
            where: { id },
            data: updateData,
            include: { category: true },
        });

        res.json(updated);
    } catch (error) {
        console.error('UpdateTransaction error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { id } = req.params;

        // Verify transaction belongs to user
        const transaction = await prisma.transaction.findFirst({
            where: { id, userId },
        });

        if (!transaction) {
            res.status(404).json({ error: 'Transaction not found' });
            return;
        }

        // Soft delete
        await prisma.transaction.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('DeleteTransaction error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getCategories = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const categories = await prisma.category.findMany({
            where: { userId, isActive: true },
            orderBy: { name: 'asc' },
        });

        res.json(categories);
    } catch (error) {
        console.error('GetCategories error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
