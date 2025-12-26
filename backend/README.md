# Personal Expense Tracker - Backend

A secure, full-featured REST API for managing personal finances with user authentication, transaction tracking, and expense categorization.

## Features

### 🔐 Authentication & Account Management
- Email + password signup and login
- JWT-based authentication (7-day expiration)
- Secure password hashing with bcryptjs
- Password reset via email verification
- Profile management (name, currency, timezone, month start day)
- User logout support

### 💰 Transaction Management
- Create, read, update, and delete transactions
- Transaction types: Income and Expense
- Payment methods: Cash, UPI, Card, Wallet, Other
- Customizable categories per user
- Optional transaction notes
- Date and time tracking
- Soft delete (archive transactions)

### 📊 List & Filtering
- Paginated transaction lists
- Filter by month (current, previous, or all)
- Smart month filtering respecting user's month start day
- Sort by date (newest first, oldest first)
- Support for infinite scroll via pagination

### 📧 Email Notifications
- Welcome email on signup
- Password reset email with secure token
- Configurable SMTP settings

### 🌍 Localization
- User timezone support
- Multi-currency support (default INR)
- Custom month start day (1-28)

## Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma v7
- **Authentication:** JWT + bcryptjs
- **Email:** Nodemailer
- **Development:** Nodemon

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/Aashbinsibi/Expense-tracker-.git
cd Expense-tracker-/backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
```

Edit `.env` and configure:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/expense_tracker

# JWT
JWT_SECRET=your_super_secret_key_change_in_production

# Server
PORT=3000
APP_URL=http://localhost:3000

# Email (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@expensetracker.com
```

4. **Setup database**
```bash
npx prisma generate
npx prisma migrate dev
```

5. **Start development server**
```bash
npm run dev
```

Server will run on `http://localhost:3000`

## API Documentation

### Base URL
```
http://localhost:3000
```

### Authentication
Include JWT token in Authorization header:
```
Authorization: Bearer <token>
```

### Available Endpoints

#### Authentication (`/auth`)
- `POST /auth/signup` - Create new account
- `POST /auth/login` - Login and get JWT token
- `POST /auth/logout` - Logout (client-side operation)
- `GET /auth/me` - Get current user profile (protected)
- `PUT /auth/profile` - Update profile (protected)
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token

#### Transactions (`/transactions`)
- `POST /transactions` - Create transaction (protected)
- `GET /transactions` - List transactions with filters (protected)
- `GET /transactions/:id` - Get single transaction (protected)
- `PUT /transactions/:id` - Update transaction (protected)
- `DELETE /transactions/:id` - Delete transaction (protected)
- `GET /transactions/categories` - Get user's categories (protected)

### Query Parameters

**For `/transactions` GET:**
- `page` - Page number (default: 1)
- `pageSize` - Items per page, max 50 (default: 20)
- `filter` - `current`, `previous`, or `all` (default: current)
- `sort` - `newest` or `oldest` (default: newest)

## Project Structure

```
backend/
├── src/
│   ├── controllers/        # Route handlers
│   │   ├── authController.ts
│   │   └── transactionController.ts
│   ├── middlewares/        # Express middlewares
│   │   └── authMiddleware.ts
│   ├── routes/            # Route definitions
│   │   ├── authRoutes.ts
│   │   └── transactionRoutes.ts
│   ├── utils/             # Helper functions
│   │   ├── jwt.ts         # Token generation/verification
│   │   ├── email.ts       # Email service
│   │   └── validation.ts  # Input validation
│   └── index.ts           # Server entry point
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Migration files
├── .env.example           # Environment variables template
├── tsconfig.json          # TypeScript configuration
├── nodemon.json           # Nodemon configuration
├── package.json
├── AUTH_API.md            # Authentication API docs
├── TRANSACTION_API.md     # Transaction API docs
└── README.md              # This file
```

## Database Schema

### User
- `id` - UUID primary key
- `name` - User's name
- `email` - Unique email
- `passwordHash` - Encrypted password
- `currency` - ISO 4217 code (default: INR)
- `monthStartDay` - 1-28 (default: 1)
- `timezone` - IANA timezone (default: Asia/Kolkata)
- `createdAt` - Account creation timestamp

### Transaction
- `id` - UUID primary key
- `userId` - Foreign key to User
- `amount` - Decimal(12,2)
- `type` - 'expense' or 'income'
- `categoryId` - Foreign key to Category
- `paymentMethod` - 'cash', 'upi', 'card', 'wallet', or 'other'
- `note` - Optional text
- `transactionAt` - Transaction date/time
- `isSynced` - Offline sync flag
- `deletedAt` - Soft delete timestamp
- `createdAt`, `updatedAt` - Timestamps

### Category
- `id` - UUID primary key
- `userId` - Foreign key to User
- `name` - Category name
- `type` - 'expense', 'income', or 'both'
- `color` - Hex color code
- `isActive` - Boolean flag

### PasswordReset
- `id` - UUID primary key
- `userId` - Foreign key to User
- `token` - Unique reset token
- `expiresAt` - Token expiration time
- `createdAt` - Creation timestamp

## Development

### Run TypeScript check
```bash
npx tsc --noEmit
```

### Generate Prisma Client
```bash
npx prisma generate
```

### Create database migration
```bash
npx prisma migrate dev --name migration_name
```

### View database in Prisma Studio
```bash
npx prisma studio
```

### Run in watch mode
```bash
npm run dev
```

## Error Handling

All API responses follow this format:

**Success:**
```json
{
  "id": "uuid",
  "name": "John Doe",
  ...
}
```

**Error:**
```json
{
  "error": "Descriptive error message"
}
```

**Status Codes:**
- `200` - OK
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (expired token)
- `404` - Not Found
- `500` - Internal Server Error

## Security Considerations

- Passwords hashed with bcryptjs (10 salt rounds)
- JWT tokens expire in 7 days
- Password reset tokens expire in 1 hour
- CORS enabled for frontend communication
- Environment variables for sensitive data
- Soft deletes for data recovery
- SQL injection prevented via Prisma ORM
- XSS protection via JSON serialization

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection string | Yes |
| JWT_SECRET | Secret key for JWT signing | Yes |
| PORT | Server port | No (default: 3000) |
| APP_URL | Frontend app URL | Yes (for email links) |
| EMAIL_HOST | SMTP server hostname | Yes |
| EMAIL_PORT | SMTP server port | Yes |
| EMAIL_SECURE | Use TLS (true/false) | No |
| EMAIL_USER | SMTP authentication username | Yes |
| EMAIL_PASSWORD | SMTP authentication password | Yes |
| EMAIL_FROM | Sender email address | No |

## Troubleshooting

### "Cannot find module '@prisma/client'"
```bash
npx prisma generate
```

### "DATABASE_URL is not set"
Make sure `.env` file exists and contains DATABASE_URL

### Email not sending
1. Check EMAIL_* variables in `.env`
2. Verify SMTP credentials
3. Check firewall/network connectivity
4. For Gmail: Use app-specific password, not regular password

### Port already in use
Change PORT in `.env` or kill the process using the port

## Mobile App Integration

For mobile clients:
1. Add transaction category management endpoints
2. Implement offline sync using `isSynced` flag
3. Use soft delete timestamps for data reconciliation
4. Store JWT securely in device keychain

For app lock (PIN/biometrics):
- Implement on mobile client side using native APIs
- Backend doesn't need changes
- Store encrypted PIN in device secure storage

## Future Enhancements

- [ ] Transaction recurring/recurring templates
- [ ] Budget management and alerts
- [ ] Expense analytics and reports
- [ ] Receipt image upload
- [ ] Multi-user shared accounts
- [ ] Transaction tagging
- [ ] Search functionality
- [ ] Data export (CSV, PDF)
- [ ] Rate limiting
- [ ] API versioning

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add your feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit a pull request

## License

ISC

## Support

For issues and questions, please open an issue on GitHub.

---

**Made with ❤️ for better expense tracking**
