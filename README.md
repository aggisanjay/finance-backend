# 💰 Finance Data Processing & Access Control Backend

A RESTful backend for a finance dashboard system with role-based access control,
financial record management, and analytical dashboard APIs.

Built with **Node.js**, **Express**, and **MongoDB** (Mongoose).

---

## 📑 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Access Control Matrix](#-access-control-matrix)
- [Design Decisions & Assumptions](#-design-decisions--assumptions)
- [Testing](#-testing)
- [Project Structure](#-project-structure)

---

## ✨ Features

- **JWT Authentication** – Register, login, profile, password change
- **Role-Based Access Control** – `admin`, `analyst`, `viewer` roles
- **Financial Records CRUD** – Full management with rich filtering
- **Dashboard Analytics** – Overview, category breakdown, monthly/weekly trends,
  recent activity, top categories
- **Soft Deletes** – Records and users are soft-deleted for data integrity
- **Input Validation** – Joi-based request validation with detailed error messages
- **Pagination & Sorting** – All list endpoints support pagination, sorting, filtering
- **Rate Limiting** – Global and auth-specific rate limiting
- **Security** – Helmet, CORS, bcrypt password hashing
- **Comprehensive Tests** – Jest + Supertest integration tests

---

## 🏗 Architecture

```
Client → Routes → Middleware (Auth + RBAC) → Controllers → Services → Models → MongoDB
```

### Separation of Concerns

| Layer           | Responsibility                               |
| --------------- | -------------------------------------------- |
| **Routes**      | HTTP method mapping and middleware chaining  |
| **Middleware**  | Auth, RBAC, rate limiting, error handling    |
| **Controllers** | Request parsing, validation, response format |
| **Services**    | Business logic and data operations           |
| **Models**      | Schema definition and database interactions  |
| **Validators**  | Joi schemas for input validation             |
| **Utils**       | Reusable helpers (ApiError, ApiResponse)     |

---

## 🛠 Tech Stack

| Technology          | Purpose          |
| ------------------- | ---------------- |
| Node.js             | Runtime          |
| Express.js          | Web framework    |
| MongoDB             | Database         |
| Mongoose            | ODM              |
| JWT                 | Authentication   |
| Joi                 | Validation       |
| bcryptjs            | Password hashing |
| Jest                | Testing          |
| Supertest           | HTTP testing     |
| Helmet              | Security headers |
| express-rate-limit  | Rate limiting    |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18
- **MongoDB** running locally or a connection URI
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd finance-backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Seed the database with sample data
npm run seed

# Start in development mode
npm run dev

# Or start in production mode
npm start
```

### Default Port

The server runs on **http://localhost:5000** by default.

### Health Check

```
GET http://localhost:5000/health
```

---

## 📡 API Reference

**Base URL:** `http://localhost:5000/api/v1`

### Authentication

| Method | Endpoint               | Description           | Auth Required |
| ------ | ---------------------- | --------------------- | ------------- |
| POST   | /auth/register         | Register new user     | No            |
| POST   | /auth/login            | Login                 | No            |
| GET    | /auth/me               | Get current profile   | Yes           |
| PATCH  | /auth/change-password  | Change own password   | Yes           |

#### Register

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "admin"
  }'
```

#### Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@finance.com",
    "password": "admin123"
  }'
```

---

### User Management (Admin Only)

| Method | Endpoint    | Description      |
| ------ | ----------- | ---------------- |
| GET    | /users      | List all users   |
| GET    | /users/:id  | Get user by ID   |
| PATCH  | /users/:id  | Update user      |
| DELETE | /users/:id  | Soft-delete user |

#### List Users with Filters

```bash
curl "http://localhost:5000/api/v1/users?role=analyst&status=active&page=1&limit=10" \
  -H "Authorization: Bearer <admin_token>"
```

---

### Financial Records

| Method | Endpoint      | Description         | Roles Allowed          |
| ------ | ------------- | ------------------- | ---------------------- |
| POST   | /records      | Create record       | admin                  |
| GET    | /records      | List records        | admin, analyst, viewer |
| GET    | /records/:id  | Get record by ID    | admin, analyst, viewer |
| PATCH  | /records/:id  | Update record       | admin                  |
| DELETE | /records/:id  | Soft-delete record  | admin                  |

#### Create Record

```bash
curl -X POST http://localhost:5000/api/v1/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "amount": 5000,
    "type": "income",
    "category": "salary",
    "date": "2024-06-15",
    "description": "Monthly salary"
  }'
```

#### List with Filters

```bash
curl "http://localhost:5000/api/v1/records?type=expense&category=food&startDate=2024-01-01&endDate=2024-12-31&minAmount=10&maxAmount=500&search=grocery&sortBy=amount&sortOrder=desc&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

**Available Filters:**

| Parameter        | Description                                                      |
| ---------------- | ---------------------------------------------------------------- |
| `type`           | `income` \| `expense`                                            |
| `category`       | `salary`, `freelance`, `investment`, `food`, `transport`, etc.   |
| `startDate`      | ISO date range start                                             |
| `endDate`        | ISO date range end                                               |
| `minAmount`      | Minimum amount filter                                            |
| `maxAmount`      | Maximum amount filter                                            |
| `search`         | Text search in description                                       |
| `sortBy`         | `amount`, `date`, `category`, `type`, `createdAt`                |
| `sortOrder`      | `asc`, `desc`                                                    |
| `page` / `limit` | Pagination controls                                              |

---

### Dashboard Analytics

| Method | Endpoint                   | Description               | Roles Allowed          |
| ------ | -------------------------- | ------------------------- | ---------------------- |
| GET    | /dashboard/overview        | Financial summary         | admin, analyst, viewer |
| GET    | /dashboard/recent          | Recent transactions       | admin, analyst, viewer |
| GET    | /dashboard/categories      | Category-wise breakdown   | admin, analyst         |
| GET    | /dashboard/trends/monthly  | Monthly income/expense    | admin, analyst         |
| GET    | /dashboard/trends/weekly   | Weekly income/expense     | admin, analyst         |
| GET    | /dashboard/top-categories  | Top spending/earning cats | admin, analyst         |

#### Overview Response Example

```json
{
  "success": true,
  "message": "Dashboard overview fetched successfully",
  "data": {
    "summary": {
      "totalIncome": 45000.00,
      "totalExpenses": 12500.50,
      "netBalance": 32499.50,
      "totalRecords": 110,
      "incomeCount": 40,
      "expenseCount": 70,
      "avgTransactionAmount": 523.19,
      "maxTransaction": 5500.00,
      "minTransaction": 5.25
    }
  }
}
```

#### Monthly Trends

```bash
curl "http://localhost:5000/api/v1/dashboard/trends/monthly?year=2024" \
  -H "Authorization: Bearer <token>"
```

---

## 🔐 Access Control Matrix

| Action                      | Viewer | Analyst | Admin |
| --------------------------- | :----: | :-----: | :---: |
| View own profile            | ✅     | ✅      | ✅    |
| Change own password         | ✅     | ✅      | ✅    |
| View financial records      | ✅     | ✅      | ✅    |
| View overview dashboard     | ✅     | ✅      | ✅    |
| View recent activity        | ✅     | ✅      | ✅    |
| View category breakdown     | ❌     | ✅      | ✅    |
| View monthly/weekly trends  | ❌     | ✅      | ✅    |
| View top categories         | ❌     | ✅      | ✅    |
| Create financial records    | ❌     | ❌      | ✅    |
| Update financial records    | ❌     | ❌      | ✅    |
| Delete financial records    | ❌     | ❌      | ✅    |
| Manage users                | ❌     | ❌      | ✅    |

---

## 🧠 Design Decisions & Assumptions

### Assumptions

- **Single-tenant system** – All records are visible to all authenticated users with appropriate role. No per-user data isolation.
- **Registration is open** – Any user can register with any role. In production, admin role assignment would be restricted.
- **Soft deletes** – Both users and records use soft-delete (`isDeleted` flag) to preserve data integrity and audit trails.
- **Date validation** – Record dates cannot be in the future.
- **Categories are predefined** – A fixed set of categories is enforced. This could be made dynamic with a separate Categories collection.

### Design Choices

- **Service layer pattern** – Controllers are thin; business logic lives in services. This makes testing and refactoring easier.
- **Joi for validation** – Chosen over express-validator for clearer schema definitions and reusability.
- **Aggregation pipelines** – Dashboard endpoints use MongoDB aggregation for efficient server-side computation instead of fetching all records.
- **Consistent response format** – All responses use `ApiResponse` utility for uniform `{ success, message, data, meta }` structure.
- **Centralized error handling** – All errors flow through the global error handler, which normalizes Mongoose, JWT, and custom errors.
- **Index strategy** – Indexes on frequently queried fields (`date`, `type`, `category`, `createdBy`) for performant reads.

### Tradeoffs

- **No refresh tokens** – Simplified auth with long-lived JWTs. Production would use refresh token rotation.
- **No file uploads** – Receipt/invoice attachments not implemented.
- **No caching** – Dashboard aggregations hit the database directly. Redis caching would improve production performance.
- **No WebSockets** – Real-time dashboard updates not implemented.

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test file
npx jest tests/auth.test.js --runInBand
npx jest tests/records.test.js --runInBand
npx jest tests/dashboard.test.js --runInBand
```

Tests require a running MongoDB instance. They use the same database configured in `.env` and clean up after themselves.

### Test Coverage

- **Auth tests** – Registration, login, profile, password change, validation errors
- **Record tests** – CRUD, RBAC enforcement, filtering, pagination, sorting, soft delete
- **Dashboard tests** – All analytics endpoints, RBAC enforcement, data correctness

---

## 📁 Project Structure

```
finance-backend/
├── src/
│   ├── config/           # Environment and database configuration
│   ├── models/           # Mongoose schemas and models
│   ├── middleware/       # Auth, RBAC, rate limiting, error handling
│   ├── validators/       # Joi validation schemas
│   ├── services/         # Business logic layer
│   ├── controllers/      # Request handlers
│   ├── routes/           # Express route definitions
│   ├── utils/            # Shared utilities
│   └── app.js            # Express app setup
├── tests/                # Integration tests
├── server.js             # Entry point
├── package.json
├── .env.example
└── README.md
```

---

## 📋 Seed Data Credentials

After running `npm run seed`:

| Role     | Email                 | Password    |
| -------- | --------------------- | ----------- |
| Admin    | admin@finance.com     | admin123    |
| Analyst  | analyst@finance.com   | analyst123  |
| Viewer   | viewer@finance.com    | viewer123   |
| Inactive | inactive@finance.com  | inactive123 |

---

## 📄 License

This project is for assessment purposes only.
