# ✈️ TripVault — Group Travel Expense & Fund Pooling Vault

<div align="center">

![TripVault Banner](https://img.shields.io/badge/TripVault-Group%20Expense%20Tracker-6366f1?style=for-the-badge&logo=compass&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

**Effortlessly manage group trip budgets, split multi-currency expenses, pool community vault funds, and settle debts with one-click UPI.**

[Features](#-key-features) • [Tech Stack](#-tech-stack) • [Quick Start](#-getting-started) • [Environment Setup](#-environment-variables) • [API Reference](#-api-endpoints) • [Project Structure](#-project-structure)

</div>

---

## 📖 Overview

Traveling with friends and family is unforgettable, but managing group finances usually turns into a headache of lost receipts, confusing math, and awkward payment reminders. 

**TripVault** is an all-in-one group travel expense manager and vault pooling application built to eliminate financial friction on trips. It lets travel groups pool upfront funds into a shared vault, log expenses with granular splitting options (equal, custom, selected members, or individual), track live net balances in real-time, send fund requests, and settle debts seamlessly using UPI.

---

## ✨ Key Features

### 🗂️ 1. Multi-Trip Management & Sharing
- **Custom Trip Profiles**: Set destinations, date ranges, trip categories, emojis, custom currency symbols (e.g. `₹`, `$`, `€`, `£`), and target budgets.
- **Trip Status & Archiving**: Manage active trips and archive completed ones to freeze transaction history.
- **Easy Companion Invites**: Invite companions instantly via shareable invite links (`/join/:id`) and QR codes.
- **Role-Based Access**: Granular roles including `Admin`, `Member`, and `Viewer`.

### 💸 2. Flexible Expense Logging & Smart Splits
- **Multi-Strategy Splitting**:
  - **Split Equally**: Automatically splits the bill equally among all trip companions.
  - **Split Selected**: Divide costs only among members who participated in that activity.
  - **Custom Split**: Assign exact, custom amounts per person with live sum validation.
  - **Self / Personal Expense**: Track individual costs without affecting other members' balances.
- **Visual Categorization**: Categorize spending across *Food & Dining, Stays & Hotels, Fuel & Transport, Flights & Trains, Activities & Sightseeing, Shopping, Groceries, Emergency, and more*.
- **Receipt Capture**: Attach bill snapshots and photo receipts directly to transactions for transparent proof.

### 🏦 3. Trip Vault (Group Fund Pooling)
- **Shared Pool Balance**: Members can contribute upfront funds into the central Trip Vault.
- **Vault vs. Individual Spending**: Pay group expenses directly from pooled vault reserves or log out-of-pocket payments made by specific members.

### 🔄 4. Fund Requests & Instant Settlement Hub
- **Peer-to-Peer Fund Requests**: Need cash or an advance? Request money from companions within the trip with real-time status tracking (`Pending`, `Payment Sent`, `Accepted`, `Declined`).
- **Smart Debt Simplification**: Automatically computes who owes whom to minimize the total number of transactions needed to balance the books.
- **Direct UPI Integration**: One-click settlement via UPI links (`upi://pay`) allowing seamless transfers through GPay, PhonePe, Paytm, or BHIM.

### 📊 5. Real-Time Balance & Budget Analytics
- **Live Net Balances**: Instant visibility into whether you are owed money (+green) or owe money (-red).
- **Budget Tracking**: Dynamic visual progress bars showing budget consumption vs total allocated funds.
- **Interactive History**: Searchable and filterable transaction logs with detailed breakdowns.

### 📱 6. Mobile-First, Modern UI/UX
- Responsive design tailored for mobile browsers and desktop displays alike.
- Fluid micro-animations, glassmorphism cards, toast feedback, and skeleton loaders.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Routing**: [React Router DOM v7](https://reactrouter.com/)
- **Icons & Notifications**: [Lucide React](https://lucide.dev/), [React Hot Toast](https://react-hot-toast.com/)
- **HTTP Client**: [Axios](https://axios-http.com/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Framework**: [Express.js v5](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose v9](https://mongoosejs.com/)
- **Authentication**: JWT ([jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)) & [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Security & Optimization**: [Helmet](https://helmetjs.github.io/), [Compression](https://github.com/expressjs/compression), [CORS](https://github.com/expressjs/cors)

---

## 📁 Project Structure

```text
tripVault/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration (MongoDB connection)
│   │   ├── controllers/     # Route controllers (Auth, Trip, Transaction, Request)
│   │   ├── middleware/      # JWT auth middleware & error handlers
│   │   ├── models/          # Mongoose data schemas (User, Trip, Transaction, FundRequest)
│   │   ├── routes/          # API route definitions
│   │   └── index.js         # Express server entry point
│   ├── .env.example         # Backend environment variables template
│   └── uploads/             # Optional local file storage
│
├── frontend/
│   ├── public/              # Static assets & icons
│   ├── src/
│   │   ├── assets/          # Images and SVGs
│   │   ├── components/      # Reusable UI components (Modal, BottomNav, CustomSelect, etc.)
│   │   ├── config/          # API base URL configuration
│   │   ├── pages/           # Application views (Dashboard, Auth, AddTransaction, History, Profile, etc.)
│   │   ├── store/           # Zustand global state stores
│   │   ├── utils/           # Helper functions & formatting utilities
│   │   ├── App.jsx          # App layout and route routing setup
│   │   ├── index.css        # Global CSS & Tailwind styling
│   │   └── main.jsx         # React application root
│   ├── .env.example         # Frontend environment variables template
│   ├── tailwind.config.js   # Tailwind configuration
│   ├── vite.config.js       # Vite bundler configuration
│   └── package.json         # Frontend dependencies & scripts
│
├── package.json             # Root scripts & backend dependencies
└── README.md                # Project documentation
```

---

## 🚀 Getting Started

Follow these steps to run TripVault locally on your machine.

### 📋 Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [MongoDB](https://www.mongodb.com/try/download/community) (Local instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection URI)

---

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Rathan-Kumar-Gaddam/tripVault.git
cd tripVault
```

---

### 2️⃣ Backend Setup

1. **Install backend dependencies** (from the root directory):
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` directory (or copy `backend/.env.example`):
   ```bash
   cp backend/.env.example backend/.env
   ```
   Fill in your details:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/tripvault?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_jwt_key
   ```

3. **Start the backend server**:
   ```bash
   # Run with nodemon for hot-reloading
   npm run dev

   # Or run with standard node
   npm start
   ```
   The backend API will start on `http://localhost:5000`.

---

### 3️⃣ Frontend Setup

1. **Navigate to the frontend folder**:
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file inside the `frontend/` directory (or copy `frontend/.env.example`):
   ```bash
   cp .env.example .env
   ```
   Set the API URL to point to your local backend:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Port on which the Express server listens | `5000` |
| `NODE_ENV` | Application environment (`development` or `production`) | `development` |
| `MONGO_URI` | MongoDB connection string (Atlas or local) | `mongodb://localhost:27017/tripvault` |
| `JWT_SECRET` | Secret key used to sign and verify JSON Web Tokens | `your_secret_key` |

### Frontend (`frontend/.env`)
| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base API URL pointing to the backend | `http://localhost:5000/api` |

---

## 🔌 API Endpoints

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register with Name, Email/Phone, and Password | No |
| `POST` | `/api/auth/login` | Login with Email and Password | No |
| `POST` | `/api/auth/login-phone` | Quick login via Phone number | No |
| `POST` | `/api/auth/send-otp` | Send Phone OTP (for verification) | No |
| `POST` | `/api/auth/verify-otp` | Verify Phone OTP | No |
| `GET` | `/api/auth/profile` | Get current logged-in user profile | Yes |
| `PUT` | `/api/auth/profile` | Update profile details (Name, UPI ID, Avatar) | Yes |

### 🧳 Trip Management (`/api/trips`)
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/trips` | Create a new trip | Yes |
| `GET` | `/api/trips` | Get all trips the user is part of | Yes |
| `GET` | `/api/trips/:tripId` | Get detailed trip info, balances, and vault stats | Yes |
| `PUT` | `/api/trips/:tripId` | Update trip info (Budget, dates, currency, etc.) | Yes |
| `DELETE` | `/api/trips/:tripId` | Delete a trip (Admin only) | Yes |
| `GET` | `/api/trips/:tripId/preview` | Preview basic trip info before joining | No |
| `POST` | `/api/trips/:tripId/join` | Join trip using invite link or ID | Yes |
| `POST` | `/api/trips/:tripId/close` | Freeze/archive a trip once completed | Yes |
| `POST` | `/api/trips/:tripId/leave` | Leave a trip | Yes |
| `POST` | `/api/trips/:tripId/members` | Add a companion to the trip | Yes |
| `DELETE` | `/api/trips/:tripId/members/:memberUserId` | Remove a companion from the trip | Yes |

### 💳 Transactions (`/api/transactions`)
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/transactions` | Log an expense, vault contribution, or settlement | Yes |
| `GET` | `/api/transactions/:tripId` | Get all transactions for a specific trip | Yes |
| `DELETE` | `/api/transactions/:id` | Delete a transaction | Yes |

### 🤝 Fund Requests & Settlements (`/api/requests`)
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/requests` | Create a fund request or settlement intent | Yes |
| `GET` | `/api/requests/trip/:tripId` | Get active requests for a trip | Yes |
| `PUT` | `/api/requests/:id/respond` | Update request status (`payment_sent`, `accepted`, `declined`) | Yes |
| `DELETE` | `/api/requests/:id` | Cancel/delete a pending request | Yes |

---

## 🚢 Deployment

### Frontend (Vercel)
1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Set the **Root Directory** to `frontend`.
4. Add the environment variable: `VITE_API_URL` pointing to your deployed backend URL.
5. Deploy!

### Backend (Render / Railway / VPS)
1. Create a Web Service on [Render](https://render.com) or [Railway](https://railway.app).
2. Set the build command: `npm install`
3. Set the start command: `npm start`
4. Configure the environment variables (`MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`, `PORT=5000`).
5. Ensure your MongoDB Atlas Network Access allows traffic from your backend hosting provider.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

<div align="center">

Made with ❤️ for smooth travels & stress-free adventures.

</div>
