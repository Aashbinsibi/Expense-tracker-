import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../index';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middlewares/authMiddleware';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../utils/email';

export const signup = async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    try {
        if (!name || !email || !password) {
            res.status(400).json({ error: 'Name, email, and password are required' });
            return;
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ error: 'Email already in use' });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
            },
        });

        const token = generateToken(user.id);
        
        // Send welcome email
        await sendWelcomeEmail(email, name);

        res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, currency: user.currency } });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const token = generateToken(user.id);

        res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email, currency: user.currency } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, currency: true, monthStartDay: true, timezone: true }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json(user);
    } catch (error) {
        console.error('GetMe error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const logout = async (req: AuthRequest, res: Response) => {
    // JWT is stateless, so logout is mainly a client-side operation
    // In a more complex system, you might blacklist tokens here
    res.status(200).json({ message: 'Logged out successfully' });
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { name, currency, monthStartDay } = req.body;

        // Validate monthStartDay
        if (monthStartDay !== undefined && (monthStartDay < 1 || monthStartDay > 28)) {
            res.status(400).json({ error: 'Month start day must be between 1 and 28' });
            return;
        }

        const updateData: any = {};
        if (name) updateData.name = name;
        if (currency) updateData.currency = currency;
        if (monthStartDay) updateData.monthStartDay = monthStartDay;

        if (Object.keys(updateData).length === 0) {
            res.status(400).json({ error: 'No fields to update' });
            return;
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: { id: true, name: true, email: true, currency: true, monthStartDay: true, timezone: true }
        });

        res.json(user);
    } catch (error) {
        console.error('UpdateProfile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Don't reveal if email exists for security reasons
            res.status(200).json({ message: 'If an account with this email exists, a reset link has been sent' });
            return;
        }

        // Delete old reset tokens
        await prisma.passwordReset.deleteMany({ where: { userId: user.id } });

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await prisma.passwordReset.create({
            data: {
                userId: user.id,
                token: resetToken,
                expiresAt,
            },
        });

        // Send email
        await sendPasswordResetEmail(email, resetToken);

        res.status(200).json({ message: 'If an account with this email exists, a reset link has been sent' });
    } catch (error) {
        console.error('RequestPasswordReset error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            res.status(400).json({ error: 'Token and new password are required' });
            return;
        }

        const resetRecord = await prisma.passwordReset.findUnique({ where: { token } });
        
        if (!resetRecord) {
            res.status(400).json({ error: 'Invalid reset token' });
            return;
        }

        if (resetRecord.expiresAt < new Date()) {
            await prisma.passwordReset.delete({ where: { id: resetRecord.id } });
            res.status(400).json({ error: 'Reset token has expired' });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: resetRecord.userId },
            data: { passwordHash },
        });

        // Delete the used token
        await prisma.passwordReset.delete({ where: { id: resetRecord.id } });

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('ResetPassword error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
