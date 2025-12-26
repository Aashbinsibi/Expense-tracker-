# Transaction API Documentation

## Endpoints

All transaction endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

### 1. Create Transaction
**POST** `/transactions`

Create a new transaction record.

**Request Body:**
```json
{
  "amount": "500.50",
  "type": "expense",
  "categoryId": "uuid",
  "date": "2025-12-26",
  "time": "14:30",
  "paymentMethod": "upi",
  "note": "Lunch with friends"
}
```

**Field Details:**
- `amount` (required): Positive decimal number
- `type` (required): `"expense"` or `"income"`
- `categoryId` (required): UUID of existing category
- `date` (required): Date in YYYY-MM-DD format
- `time` (required): Time in HH:MM format (24-hour)
- `paymentMethod` (required): One of: `cash`, `upi`, `card`, `wallet`, `other`
- `note` (optional): Text field for additional details

**Response (201 Created):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "amount": "500.50",
  "type": "expense",
  "categoryId": "uuid",
  "paymentMethod": "upi",
  "note": "Lunch with friends",
  "transactionAt": "2025-12-26T14:30:00.000Z",
  "createdAt": "2025-12-26T10:00:00.000Z",
  "updatedAt": "2025-12-26T10:00:00.000Z",
  "isSynced": false,
  "deletedAt": null,
  "category": {
    "id": "uuid",
    "name": "Food",
    "type": "expense",
    "color": "#FF6B6B"
  }
}
```

---

### 2. Get Transactions
**GET** `/transactions`

Retrieve transactions with pagination, filtering, and sorting.

**Query Parameters:**
- `page` (optional): Page number, default 1
- `pageSize` (optional): Items per page, default 20, max 50
- `filter` (optional): `"current"`, `"previous"`, or `"all"`, default `"current"`
  - `current`: Transactions in current month (respects user's monthStartDay)
  - `previous`: Transactions in previous month
  - `all`: All transactions
- `sort` (optional): `"newest"` or `"oldest"`, default `"newest"`

**Example Request:**
```
GET /transactions?page=1&pageSize=20&filter=current&sort=newest
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "amount": "500.50",
      "type": "expense",
      "categoryId": "uuid",
      "paymentMethod": "upi",
      "note": "Lunch with friends",
      "transactionAt": "2025-12-26T14:30:00.000Z",
      "createdAt": "2025-12-26T10:00:00.000Z",
      "updatedAt": "2025-12-26T10:00:00.000Z",
      "isSynced": false,
      "deletedAt": null,
      "category": {
        "id": "uuid",
        "name": "Food",
        "type": "expense",
        "color": "#FF6B6B"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### 3. Get Transaction by ID
**GET** `/transactions/:id`

Retrieve a specific transaction by ID.

**Response (200 OK):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "amount": "500.50",
  "type": "expense",
  "categoryId": "uuid",
  "paymentMethod": "upi",
  "note": "Lunch with friends",
  "transactionAt": "2025-12-26T14:30:00.000Z",
  "createdAt": "2025-12-26T10:00:00.000Z",
  "updatedAt": "2025-12-26T10:00:00.000Z",
  "isSynced": false,
  "deletedAt": null,
  "category": {
    "id": "uuid",
    "name": "Food",
    "type": "expense",
    "color": "#FF6B6B"
  }
}
```

---

### 4. Update Transaction
**PUT** `/transactions/:id`

Update an existing transaction.

**Request Body (all fields optional):**
```json
{
  "amount": "600.00",
  "type": "expense",
  "categoryId": "uuid",
  "date": "2025-12-26",
  "time": "15:00",
  "paymentMethod": "card",
  "note": "Updated note"
}
```

**Response (200 OK):**
Same as create transaction response

---

### 5. Delete Transaction
**DELETE** `/transactions/:id`

Soft delete a transaction (sets deletedAt timestamp).

**Response (200 OK):**
```json
{
  "message": "Transaction deleted successfully"
}
```

---

### 6. Get Categories
**GET** `/transactions/categories`

Get all active categories for the current user. Used for transaction form dropdown.

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "name": "Food",
    "type": "expense",
    "color": "#FF6B6B",
    "isActive": true
  },
  {
    "id": "uuid",
    "userId": "uuid",
    "name": "Salary",
    "type": "income",
    "color": "#51CF66",
    "isActive": true
  }
]
```

---

## Features

### Transaction Form
✅ Amount validation (positive decimal)  
✅ Type selection (Expense/Income)  
✅ Category dropdown (user's categories)  
✅ Date picker (default today)  
✅ Time picker (default current time)  
✅ Payment method dropdown (Cash, UPI, Card, Wallet, Other)  
✅ Optional note field  

### List Screen
✅ Pagination (configurable page size, max 50)  
✅ Infinite scroll support (use pagination)  
✅ Sort by date (newest first / oldest first)  
✅ Filter by month:
  - Current month (respects monthStartDay preference)
  - Previous month
  - All transactions  

---

## Error Responses

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common Status Codes:**
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `404` - Not Found (transaction or category doesn't exist)
- `500` - Internal Server Error

---

## Notes

- Deleted transactions are soft-deleted (deletedAt field set) and excluded from list queries
- Month filtering respects the user's monthStartDay preference
- Amount is stored as decimal with 2 decimal places
- All timestamps are in ISO 8601 format (UTC)
