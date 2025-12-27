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

// Email validation
export const validateEmail = (email: any): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof email === 'string' && emailRegex.test(email);
};

// Password validation - minimum 8 chars, at least one uppercase, one lowercase, one number
export const validatePassword = (password: any): boolean => {
    if (typeof password !== 'string' || password.length < 8) {
        return false;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

// Name validation - non-empty string, max 100 chars
export const validateName = (name: any): boolean => {
    return typeof name === 'string' && name.trim().length > 0 && name.length <= 100;
};

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
