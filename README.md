# Annapoorna B2B Grocery Wholesale Distribution & GST Billing System

A **B2B Grocery Wholesale & FMCG Distribution Management and GST Billing System** built for wholesale distributors supplying supermarkets and retail grocery chains in bulk.

---

## 🌟 Key System Capabilities

### 1. Pricing Engine: `Product + Price Category = Selling Price`
- Selling prices are determined strictly by **Product + Price Category** (`Bulk`, `Loose`, `Wholesale`, `Retail`, `Special`), never hardcoded on customer profiles.
- When sales reps visit customers, selecting the customer and price tier dynamically updates line item unit rates, GST calculations, and order subtotals in real-time.

### 2. Statutory Indian GST Engine
- **Intrastate Supply (Buyer State == Seller State: 33 Tamil Nadu)**:
  - Automatically splits GST into **CGST (2.5%)** and **SGST (2.5%)**.
- **Interstate Supply (Buyer State &ne; Seller State, e.g. 29 Karnataka)**:
  - Automatically routes to **IGST (5.0%)**.
- Line discounts, HSN tax breakdowns, Round-Off, and **Indian Rupee Amount in Words** are computed with double-precision accuracy.

### 3. End-to-End Order-to-Cash Workflow Pipeline
```
Admin / Setup ➔ Sales Rep Booking (Mobile-First) ➔ Stock Check & Reservation ➔ 
Approval ➔ Warehouse Packing ➔ Dispatch & Automated Invoice Generation ➔ 
Delivery Fleet Tracking & POD Capture ➔ Payment Settlement & Customer Ledger ➔ 
GSTR-1 Table 12 HSN Summary Returns
```

---

## 📊 Pre-Loaded Showcase & Demonstration Dataset

This repository includes a **comprehensive, realistic FMCG grocery wholesale dataset** ready for live demonstrations, reviews, and portfolio showcases:

- **Direct Web Inspection**: Browse the full dataset in structured JSON directly on GitHub: [`data/showcase-dataset.json`](./data/showcase-dataset.json).
- **Pre-Seeded Database Included**: The SQLite database file (`prisma/dev.db`) is committed in the repository, allowing you to clone and run the app immediately with zero database setup!
- **Dataset Composition**:
  - **14 FMCG Products with High-Resolution Photos**: Ponni Boiled Rice, Sona Masoori Rice, Unpolished Toor Dal, Urad Dal Gota, Moong Dal, Crystal Pure Sugar M30, Gold Winner Sunflower Oil, Idhayam Sesame Oil, Aashirvaad Chakki Atta, Superior Maida, Everest Chilli Powder, Tata Salt, Surf Excel Detergent, and Tata Tea Premium.
  - **Multi-Tier Price Matrix**: Dynamic Bulk, Loose, Wholesale, Retail, and Special rates mapped across all products.
  - **Diverse B2B Customer Profiles**: Premier supermarkets (`Sri Lakshmi Stores`, `ABC Supermarket`), commercial wholesalers (`Kumar Traders`), interstate buyers demonstrating 5% IGST (`XYZ Mega Mart Bangalore`), and Kirana retail stores (`Murugan Kirana`).
  - **Sample B2B Orders & GST Invoices**: Active transactions covering all pipeline states (`DELIVERED`, `CONFIRMED`, `PENDING`), automated GST calculation, partial and full payment records (UPI & NEFT), and printable B2B Tax Invoices with PDF downloads.
  - **FEFO Inventory Batches**: Realistic batches with manufacturing dates, expiry dates, stock quantities, and movement audit trails.

---

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database & ORM**: Prisma ORM with SQLite (Local) / PostgreSQL (Vercel Production)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **PDF Generation**: jsPDF + jsPDF-AutoTable
- **Security**: JWT Authentication + bcryptjs + Strict Role-Based Access Control (RBAC)

---

## ⚡ Quick Start (Local Development)

### 1. Clone and Install Dependencies
```bash
git clone https://github.com/prithivi-17-riv/b2b-grocery-dist.git
cd b2b-grocery-dist
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="b2b-grocery-dist-jwt-secret-key-local"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Initialize & Seed Database
```bash
npx prisma db push
npm run prisma:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Pre-Configured Demo Accounts

Use the **One-Click Role Switcher** at the top of the app or log in with:

| Role | User Name | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | Rajesh Sharma | `admin@annapoorna.com` | `admin123` | Master pricing matrix, approvals, GSTR-1 returns, audit trail, company & tax settings |
| **Field Sales Officer** | Arun Kumar | `sales@annapoorna.com` | `sales123` | Mobile-first field sales booking (`/orders/new`), dynamic price tier rate changes, customer CRM & ledgers |
| **Warehouse Staff** | Muthu Pandi | `warehouse@annapoorna.com` | `warehouse123` | Multi-godown stocks, batch FEFO expiry alerts, stock receipts, packing & dispatch |
| **Delivery Staff** | Selvam K | `delivery@annapoorna.com` | `delivery123` | Vehicle consignment deliveries, status updates, Proof of Delivery (POD) signature capture |

---

## ☁️ Deploying to Vercel

### Step 1: Provision a Free Cloud PostgreSQL Database
Vercel is a serverless environment, so a cloud database like **[Neon](https://neon.tech)**, **[Supabase](https://supabase.com)**, or **[Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)** is recommended:
1. Create a free account on [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com).
2. Create a new PostgreSQL project and copy the connection string:
   ```
   postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Step 2: Update Prisma Provider for PostgreSQL (Production)
In `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql" // change from "sqlite" to "postgresql"
  url      = env("DATABASE_URL")
}
```

### Step 3: Push Schema & Seed Remote Database
```bash
DATABASE_URL="your-postgres-connection-string" npx prisma db push
DATABASE_URL="your-postgres-connection-string" npx tsx prisma/seed.ts
```

### Step 4: Deploy on Vercel
1. Go to [vercel.com/new](https://vercel.com/new) and import your GitHub repository.
2. Under **Environment Variables**, add:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `JWT_SECRET`: A secure random string (e.g. `c7b89f81a17e0...`).
   - `NEXT_PUBLIC_APP_URL`: Your Vercel deployment URL (e.g. `https://b2b-grocery-dist.vercel.app`).
3. Click **Deploy**.

---

## 📄 License
This project is proprietary and intended for B2B grocery distribution operations.
