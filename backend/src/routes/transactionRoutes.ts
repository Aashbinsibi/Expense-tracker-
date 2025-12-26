import express from 'express';
import {
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
    getCategories,
} from '../controllers/transactionController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = express.Router();

// All transaction routes require authentication
router.use(authenticateToken);

// Transaction CRUD
router.post('/', createTransaction);
router.get('/', getTransactions);
router.get('/categories', getCategories);
router.get('/:id', getTransactionById);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
