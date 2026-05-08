# Sikko Industries Invoice Management System

A professional, role-based invoice management system built for Sikko Industries. This application features a React-based frontend and a Node.js/Express backend with MySQL database integration.

## 🚀 Key Features

- **Role-Based Access Control (RBAC)**:
  - **Admin**: Full access to manage products, customers, invoices, and organization settings.
  - **Sales/Accountant**: Restricted access. Can create invoices and manage their own history, but cannot access master customer or product lists.
- **Advanced Invoicing**:
  - Auto-calculation of CGST/SGST and discounts.
  - Professional PDF generation with Sikko branding.
  - Editable default Terms & Conditions and Internal Notes.
  - Advanced status management (Pending/Paid).
- **Unified Hosting**: The backend server is configured to serve the production frontend build, allowing for a single-server deployment on port 5000.

## 🛠️ Tech Stack

- **Frontend**: React (v19), Axios, jsPDF, html2canvas.
- **Backend**: Node.js, Express (v5), MySQL (mysql2).
- **Styling**: Premium Vanilla CSS.

## 📦 Getting Started

### 1. Prerequisites
- Node.js installed.
- MySQL Server running.

### 2. Database Setup
1. Create a database named `invoice_db`.
2. Configure your credentials in `server/.env`.
3. The system will automatically initialize tables and seed default data on first run.

### 3. Installation & Running
```bash
# Install dependencies
npm install
cd server
npm install

# Start the unified production server
npm start
```
The application will be available at: **http://localhost:5000**

## 📂 Project Structure

- `/src`: React frontend source code.
- `/server`: Express backend and database logic.
- `/build`: Production-ready frontend bundle (served by backend).

---
*Developed for Sikko Industries.*
