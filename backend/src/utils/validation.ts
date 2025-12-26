export interface TransactionFormData {
    amount: string | number;
    type: 'expense' | 'income';
    categoryId: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    paymentMethod: 'cash' | 'upi' | 'card' | 'wallet' | 'other';
    note?: string;
}

export const PAYMENT_METHODS = ['cash', 'upi', 'card', 'wallet', 'other'] as const;
export const TRANSACTION_TYPES = ['expense', 'income'] as const;

export const validateAmount = (amount: any): boolean => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
};

export const validateTransactionType = (type: any): type is 'expense' | 'income' => {
    return TRANSACTION_TYPES.includes(type);
};

export const validatePaymentMethod = (method: any): method is typeof PAYMENT_METHODS[number] => {
    return PAYMENT_METHODS.includes(method);
};

export const validateDate = (date: string): boolean => {
    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime());
};

export const validateTime = (time: string): boolean => {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
};
