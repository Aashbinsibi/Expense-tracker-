# Dashboard API Documentation

## Overview

Dashboard endpoints provide quick insights into financial data for the home screen, including monthly summaries, trends, and category breakdowns.

All dashboard endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Get Current Month Summary
**GET** `/dashboard/summary`

Retrieve the current month's financial summary with key metrics.

**Response (200 OK):**
```json
{
  "summary": {
    "totalIncome": 15000.50,
    "totalExpense": 8500.75,
    "netBalance": 6499.75,
    "transactionCount": 24,
    "currency": "INR",
    "monthStart": "2025-12-01T00:00:00.000Z",
    "monthEnd": "2025-12-31T23:59:59.999Z"
  }
}
```

**Fields:**
- `totalIncome` - Sum of all income transactions in current month
- `totalExpense` - Sum of all expense transactions in current month
- `netBalance` - Income minus Expense (positive = green, negative = red)
- `transactionCount` - Total number of transactions
- `currency` - User's preferred currency code
- `monthStart`, `monthEnd` - Current month boundaries (respects monthStartDay)

**Frontend Usage:**
Display these as summary cards on home dashboard:
```
┌─────────────────────────────────────┐
│ Total Income       ₹15,000          │
│ Total Expense      ₹8,500           │
│ Net Balance        ₹6,499 (green)   │
│ Transactions       24               │
└─────────────────────────────────────┘
```

---

### 2. Get Monthly Trend
**GET** `/dashboard/trend`

Retrieve income and expense trends for the last N months.

**Query Parameters:**
- `months` (optional): Number of months to retrieve, default 6, min 1, max 24

**Example Request:**
```
GET /dashboard/trend?months=6
```

**Response (200 OK):**
```json
{
  "trend": [
    {
      "month": "Aug 2025",
      "income": 12000.00,
      "expense": 7500.00,
      "net": 4500.00
    },
    {
      "month": "Sep 2025",
      "income": 14500.00,
      "expense": 8200.00,
      "net": 6300.00
    },
    {
      "month": "Oct 2025",
      "income": 13000.00,
      "expense": 7800.00,
      "net": 5200.00
    },
    {
      "month": "Nov 2025",
      "income": 15500.00,
      "expense": 8100.00,
      "net": 7400.00
    },
    {
      "month": "Dec 2025",
      "income": 15000.50,
      "expense": 8500.75,
      "net": 6499.75
    }
  ],
  "currency": "INR"
}
```

**Frontend Usage:**
Use for line charts or comparison views:
```
Chart Type: Line Chart / Bar Chart
X-Axis: Month
Y-Axis: Amount (Income/Expense/Net)
Series: income, expense, net
```

---

### 3. Get Category Breakdown
**GET** `/dashboard/breakdown`

Retrieve expense or income breakdown by category for current month.

**Query Parameters:**
- `type` (optional): `"expense"` or `"income"`, default `"expense"`

**Example Request:**
```
GET /dashboard/breakdown?type=expense
```

**Response (200 OK):**
```json
{
  "breakdown": [
    {
      "categoryId": "uuid-1",
      "name": "Food & Dining",
      "color": "#FF6B6B",
      "amount": 2500.00,
      "percentage": 29.41
    },
    {
      "categoryId": "uuid-2",
      "name": "Transportation",
      "color": "#4ECDC4",
      "amount": 1800.00,
      "percentage": 21.18
    },
    {
      "categoryId": "uuid-3",
      "name": "Utilities",
      "color": "#FFE66D",
      "amount": 1200.00,
      "percentage": 14.12
    },
    {
      "categoryId": "uuid-4",
      "name": "Entertainment",
      "color": "#A8E6CF",
      "amount": 800.00,
      "percentage": 9.41
    },
    {
      "categoryId": "uuid-5",
      "name": "Other",
      "color": "#666666",
      "amount": 1200.75,
      "percentage": 14.12
    }
  ],
  "total": 8500.75,
  "currency": "INR",
  "type": "expense"
}
```

**Fields:**
- `categoryId` - Category UUID
- `name` - Category name
- `color` - Hex color code for visualization
- `amount` - Total amount in this category
- `percentage` - Percentage of total (2 decimal places)
- Data sorted by amount (descending)

**Frontend Usage:**
Use for pie/donut charts or category breakdown lists:
```
Chart Type: Pie Chart / Donut Chart
Labels: Category names
Colors: Use color field
Values: Amount or percentage
```

---

## Response Format

### Success
```json
{
  "summary": { ... },
  "trend": [ ... ],
  "breakdown": [ ... ]
}
```

### Error
```json
{
  "error": "Error message"
}
```

---

## Status Codes

- `200` - OK
- `401` - Unauthorized (missing/invalid token)
- `404` - User not found
- `500` - Internal Server Error

---

## Frontend Implementation Guide

### Home Dashboard Layout

```
┌─────────────────────────────────────────┐
│          Personal Expense Tracker        │
├─────────────────────────────────────────┤
│
│  [Summary Cards]
│  ┌──────────┬──────────┬──────────────┐
│  │ Income   │ Expense  │ Net Balance  │
│  │ ₹15,000  │ ₹8,500   │ ₹6,499 (✓)   │
│  └──────────┴──────────┴──────────────┘
│  
│  Transactions: 24
│
│  [Quick Actions]
│  ┌─────────────────┬──────────────────┐
│  │ + Add Expense   │  Transactions    │
│  │ (Primary)       │  (Secondary)     │
│  └─────────────────┴──────────────────┘
│
│  [Chart - Monthly Trend]
│  Line/Bar Chart showing last 6 months
│
│  [Chart - Category Breakdown]
│  Pie/Donut Chart showing expense categories
│
└─────────────────────────────────────────┘
```

### Implementation Steps

1. **Fetch summary** on component mount:
   ```
   GET /dashboard/summary
   ```
   Display in card grid

2. **Fetch trend data**:
   ```
   GET /dashboard/trend?months=6
   ```
   Render as line/bar chart

3. **Fetch breakdown**:
   ```
   GET /dashboard/breakdown?type=expense
   ```
   Render as pie/donut chart

4. **Quick Actions**:
   - **Add Expense**: Navigate to transaction form with type="expense" pre-selected
   - **Transactions**: Navigate to transaction list with filter="current"

---

## Notes

- All monetary values are returned as floats with 2 decimal places
- Respects user's `monthStartDay` preference for month boundaries
- Month filtering automatically handles year boundaries
- Category colors are provided in hex format (#RRGGBB)
- Percentages sum to 100% (when total > 0)
- Soft-deleted transactions (deletedAt != null) are excluded
