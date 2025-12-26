# Authentication API Documentation

## Endpoints

### 1. Sign Up
**POST** `/auth/signup`

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "currency": "INR"
  }
}
```

---

### 2. Login
**POST** `/auth/login`

Authenticate with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "currency": "INR"
  }
}
```

---

### 3. Get Profile (Protected)
**GET** `/auth/me`

Retrieve current user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "currency": "INR",
  "monthStartDay": 1,
  "timezone": "Asia/Kolkata"
}
```

---

### 4. Update Profile (Protected)
**PUT** `/auth/profile`

Update user profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Jane Doe",
  "currency": "USD",
  "monthStartDay": 15
}
```

**Validation:**
- `monthStartDay` must be between 1 and 28

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Jane Doe",
  "email": "john@example.com",
  "currency": "USD",
  "monthStartDay": 15,
  "timezone": "Asia/Kolkata"
}
```

---

### 5. Logout (Protected)
**POST** `/auth/logout`

Logout the current user (client-side operation with JWT).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

### 6. Request Password Reset
**POST** `/auth/forgot-password`

Request a password reset email.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "If an account with this email exists, a reset link has been sent"
}
```

**Note:** The endpoint doesn't reveal whether the email exists for security reasons.

---

### 7. Reset Password
**POST** `/auth/reset-password`

Reset password using the reset token from email.

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "password": "newSecurePassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset successfully"
}
```

**Errors:**
- `400` - Invalid or expired reset token

---

## Error Responses

All errors return appropriate HTTP status codes:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common Status Codes:**
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (expired token)
- `404` - Not Found (user doesn't exist)
- `500` - Internal Server Error

---

## Environment Variables Required

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/expense_tracker

# JWT
JWT_SECRET=your_secret_key

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

---

## Features

✅ **Email + Password Authentication** - Signup and login with email  
✅ **Profile Management** - Update name, currency, and month start day  
✅ **Password Reset** - Forgot password with email verification  
✅ **JWT Tokens** - 7-day expiration for security  
✅ **Secure Password Hashing** - bcryptjs with 10 salt rounds  
✅ **Email Notifications** - Welcome email and password reset emails  

---

## Mobile App Notes

For local app lock (PIN/biometrics):
- This should be implemented on the mobile client side
- Use device-native biometric APIs (Face ID, Touch ID, fingerprint)
- Store PIN securely in device keychain/secure storage
- Implement timeout after inactivity
