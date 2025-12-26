import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getCurrentMonthSummary = async (req: AuthRequest, res: Response) => {
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

        // Calculate current month based on monthStartDay
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        let monthStart: Date;
        let monthEnd: Date;

        if (now.getDate() >= user.monthStartDay) {
            monthStart = new Date(currentYear, currentMonth, user.monthStartDay);
            monthEnd = new Date(currentYear, currentMonth + 1, user.monthStartDay - 1);
        } else {
            monthStart = new Date(currentYear, currentMonth - 1, user.monthStartDay);
            monthEnd = new Date(currentYear, currentMonth, user.monthStartDay - 1);
        }

        // Get transactions for current month
        const transactions = await prisma.transaction.findMany({
            where: {
                userId,
                deletedAt: null,
                transactionAt: {
                    gte: monthStart,
                    lte: monthEnd,
                },
            },
        });

        // Calculate totals
        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach((tx) => {
            const amount = typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount.toString());
            if (tx.type === 'income') {
                totalIncome += amount;
            } else {
                totalExpense += amount;
            }
        });

        const netBalance = totalIncome - totalExpense;
        const transactionCount = transactions.length;

        res.json({
            summary: {
                totalIncome: parseFloat(totalIncome.toFixed(2)),
                totalExpense: parseFloat(totalExpense.toFixed(2)),
                netBalance: parseFloat(netBalance.toFixed(2)),
                transactionCount,
                currency: user.currency,
                monthStart: monthStart.toISOString(),
                monthEnd: monthEnd.toISOString(),
            },
        });
    } catch (error) {
        console.error('GetCurrentMonthSummary error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getMonthlyTrend = async (req: AuthRequest, res: Response) => {
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

        const months = parseInt(req.query.months as string) || 6;
        const now = new Date();
        const monthlyData = [];

        for (let i = months - 1; i >= 0; i--) {
            const targetYear = now.getFullYear();
            const targetMonth = now.getMonth() - i;

            let monthStart: Date;
            let monthEnd: Date;
            let displayMonth: string;

            if (targetMonth < 0) {
                const adjustedYear = targetYear - 1;
                const adjustedMonth = 12 + targetMonth;
                monthStart = new Date(adjustedYear, adjustedMonth, user.monthStartDay);
                monthEnd = new Date(adjustedYear, adjustedMonth + 1, user.monthStartDay - 1);
                displayMonth = new Date(adjustedYear, adjustedMonth).toLocaleString('default', {
                    month: 'short',
                    year: 'numeric',
                });
            } else {
                monthStart = new Date(targetYear, targetMonth, user.monthStartDay);
                monthEnd = new Date(targetYear, targetMonth + 1, user.monthStartDay - 1);
                displayMonth = new Date(targetYear, targetMonth).toLocaleString('default', {
                    month: 'short',
                    year: 'numeric',
                });
            }

            // Get transactions for this month
            const transactions = await prisma.transaction.findMany({
                where: {
                    userId,
                    deletedAt: null,
                    transactionAt: {
                        gte: monthStart,
                        lte: monthEnd,
                    },
                },
            });

            let income = 0;
            let expense = 0;

            transactions.forEach((tx) => {
                const amount = typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount.toString());
                if (tx.type === 'income') {
                    income += amount;
                } else {
                    expense += amount;
                }
            });

            monthlyData.push({
                month: displayMonth,
                income: parseFloat(income.toFixed(2)),
                expense: parseFloat(expense.toFixed(2)),
                net: parseFloat((income - expense).toFixed(2)),
            });
        }

        res.json({
            trend: monthlyData,
            currency: user.currency,
        });
    } catch (error) {
        console.error('GetMonthlyTrend error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getCategoryBreakdown = async (req: AuthRequest, res: Response) => {
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

        const type = (req.query.type as string) || 'expense'; // 'expense' or 'income'

        // Calculate current month based on monthStartDay
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        let monthStart: Date;
        let monthEnd: Date;

        if (now.getDate() >= user.monthStartDay) {
            monthStart = new Date(currentYear, currentMonth, user.monthStartDay);
            monthEnd = new Date(currentYear, currentMonth + 1, user.monthStartDay - 1);
        } else {
            monthStart = new Date(currentYear, currentMonth - 1, user.monthStartDay);
            monthEnd = new Date(currentYear, currentMonth, user.monthStartDay - 1);
        }

        // Get transactions grouped by category
        const transactions = await prisma.transaction.findMany({
            where: {
                userId,
                type,
                deletedAt: null,
                transactionAt: {
                    gte: monthStart,
                    lte: monthEnd,
                },
            },
            include: { category: true },
        });

        // Group by category
        const categoryMap = new Map<string, { name: string; color: string; amount: number }>();

        transactions.forEach((tx) => {
            const amount = typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount.toString());
            const existing = categoryMap.get(tx.categoryId) || {
                name: tx.category.name,
                color: tx.category.color,
                amount: 0,
            };
            categoryMap.set(tx.categoryId, {
                ...existing,
                amount: existing.amount + amount,
            });
        });

        // Calculate total and percentages
        const total = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.amount, 0);
        const breakdown = Array.from(categoryMap.entries()).map(([id, data]) => ({
            categoryId: id,
            name: data.name,
            color: data.color,
            amount: parseFloat(data.amount.toFixed(2)),
            percentage: total > 0 ? parseFloat(((data.amount / total) * 100).toFixed(2)) : 0,
        }));

        // Sort by amount (descending)
        breakdown.sort((a, b) => b.amount - a.amount);

        res.json({
            breakdown,
            total: parseFloat(total.toFixed(2)),
            currency: user.currency,
            type,
        });
    } catch (error) {
        console.error('GetCategoryBreakdown error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
