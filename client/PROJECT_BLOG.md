# FinSite: Building a Digital Invoice-Financing Marketplace

## Introduction

Small and medium-sized businesses often deliver products or services before their customers pay the related invoices. This delay can create a working-capital problem: the business may have revenue on paper but not enough cash available for salaries, suppliers, inventory, and daily operations.

FinSite is a full-stack web application designed around this problem. It connects MSMEs that need early access to invoice value with lenders that are willing to fund eligible invoices. The platform combines verification, risk analysis, offers, wallets, agreements, and deal tracking in one workflow.

The project is implemented as an academic/prototype platform using React on the frontend, Node.js and Express on the backend, PostgreSQL for persistence, and Prisma as the database access layer.

## The product idea

FinSite treats an unpaid invoice as a potential financing asset:

```text
MSME submits invoice
        ↓
KYC and business information are checked
        ↓
Credit and fraud-risk rules are evaluated
        ↓
Eligible invoice is listed for lenders
        ↓
Lender creates a funding offer
        ↓
MSME accepts an offer
        ↓
Offer becomes an active deal
        ↓
Wallets, agreements, repayment, and communication are tracked
```

The goal is to make invoice financing more structured, transparent, and easier to manage than a process based on disconnected spreadsheets, messages, and manual approvals.

## Who uses the application?

### MSME

The MSME is the business that wants to unlock cash from an unpaid invoice. It can:

- Create an account
- Submit business KYC information
- Wait for administrator verification
- Upload invoice information
- Review the invoice risk result
- See offers from lenders
- Accept a suitable offer
- Track funding and repayment activity
- Use the wallet and deal meeting features

### Lender

The lender provides funding for eligible invoices. It can:

- Register as a lender
- Submit organization and financial verification details
- Wait for approval
- Add funds to the platform wallet
- Browse invoices open for funding
- Create an offer with a funding amount and interest rate
- Track investments and deal status

### Administrator

The administrator supervises platform operations. It can:

- View dashboard statistics
- Review MSME KYC submissions
- Review lender profiles
- Approve or reject verification requests
- Review deals
- View available call-recording information

### Controller

The controller manages configurable platform capabilities. Feature flags can be used to enable or disable modules such as invoice upload, KYC, wallet, analytics, lender KYC, and communication.

## Complete business flow

### 1. Registration

The user selects an MSME or lender role on the registration page. The backend validates the account details, hashes the password with bcrypt, creates the user, and creates a wallet for the financial roles.

After registration, the user signs in and receives a JSON Web Token. The frontend stores the authenticated session and redirects the user to the dashboard for the selected role.

### 2. MSME KYC

Before creating invoices, an MSME submits business information including legal details, GST information, business start date, address, and turnover.

The KYC record begins in a non-verified state. An administrator reviews it from the admin verification area. Approval changes the MSME's verification status and enables the invoice workflow.

### 3. Lender verification

Lenders submit a separate profile containing information such as lender type, organization name, registration information, RBI or PAN details, contact details, investment preferences, and bank information.

Administrators can review the profile and verify the required checklist items. Only verified lenders are allowed to create funding offers.

### 4. Invoice upload

The verified MSME submits:

- Invoice amount
- Due date
- Buyer GSTIN
- Optional invoice number

The backend validates the request and confirms that the user is an MSME with verified KYC. It then stores the invoice and starts the risk evaluation.

### 5. Risk analysis

The current risk engine is deterministic and rules-based. It is not a trained machine-learning model.

The credit calculation uses:

- Business age
- Annual turnover
- GST verification and active years
- Invoice amount as a percentage of annual turnover

The fraud calculation uses:

- Invoice-to-turnover ratio
- A spike compared with recent invoices
- Repeated round-number invoice patterns
- Business-age and invoice-size mismatch
- Similar duplicate invoices submitted within a recent time window

The engine produces:

- Base credit score
- Fraud score
- Fraud probability
- Risk-adjusted final score
- Credit-risk band
- Fraud-risk band
- A detailed explanation of score components

An invoice with excessive fraud risk or a low final score remains pending. Otherwise, it can become open for funding.

### 6. Funding offers

Verified lenders browse invoices that are open for funding. A lender submits a funding amount and interest rate.

Before creating the offer, the backend checks:

- The lender's verification status
- The invoice status
- The lender wallet balance

The proposed funding amount is moved from the lender's available balance to its locked balance. This prevents the lender from promising more money than is available.

### 7. Offer acceptance

The MSME reviews pending offers for its invoice. When it accepts one:

1. The selected offer becomes accepted.
2. The invoice becomes funded.
3. Other pending offers are rejected.
4. Rejected offer amounts are released back to the other lenders.
5. An active deal is created.
6. The MSME wallet receives the funded amount.

This operation is performed inside a Prisma transaction so the related status and wallet changes are intended to remain consistent.

### 8. Deal and agreement

A deal stores the lender, MSME, invoice amount, funded amount, interest, platform fee, total amount payable, due date, and status.

The application can generate a PDF agreement containing the parties, invoice details, financial terms, agreement status, and acknowledgement fields. The lender and MSME can record their agreement acknowledgements through the platform.

### 9. Repayment

The application tracks repayment through its own deal and wallet records. When repayment is processed, it calculates the lender's return, releases locked funds, adds earnings, updates the MSME balance, closes the deal, and closes the related invoice.

This is an application-level wallet flow. The inspected implementation does not show a live bank-transfer or payment-gateway integration.

### 10. Deal meetings

A deal can include a two-person meeting room. The backend creates a call session and issues a signed room token. Socket.IO relays WebRTC offer, answer, and ICE-candidate messages between the two participants.

The meeting experience also supports:

- Video and audio through the browser's WebRTC APIs
- A room limited to the deal participants
- Text chat
- Call lifecycle events
- Browser recording through `MediaRecorder`
- Uploading recordings to the server

## Technical architecture

```text
React/Vite browser client
        │
        ├── REST requests with Axios
        ├── Socket.IO notifications and signaling
        └── WebRTC media connection
                │
Node.js + Express API
        │
        ├── Authentication and role middleware
        ├── KYC and lender verification controllers
        ├── Invoice and risk-engine services
        ├── Offer, deal, and wallet transactions
        ├── PDF generation
        └── Socket.IO namespaces
                │
Prisma ORM
        │
PostgreSQL database
```

## Frontend architecture

The React application uses:

- `App.jsx` for route registration
- Protected and public route guards
- Context providers for auth, theme, and feature flags
- API modules under `src/api`
- Reusable components for navigation, dashboards, forms, dialogs, and admin areas
- Vite for development and production builds
- Tailwind CSS and project stylesheets for the visual system

The route structure separates public pages from role-specific protected pages. For example, MSMEs use invoice and KYC routes, lenders use funding and lender-KYC routes, and administrators use verification and monitoring routes.

## Backend architecture

The Express application exposes REST resources under `/api`:

- `/api/auth`
- `/api/kyc`
- `/api/lender`
- `/api/admin`
- `/api/invoices`
- `/api/features`
- `/api/offers`
- `/api/deal`
- `/api/wallet`
- `/api/call`

Authentication middleware validates tokens, role middleware restricts role-specific operations, and feature middleware controls module availability.

## Database design

The PostgreSQL schema contains models for users, KYC profiles, lender profiles, invoices, risk analysis, offers, bids, transactions, deals, wallets, call sessions, and feature flags.

The most important relationships are:

- One user can own many invoices.
- An invoice can have many offers and one active deal.
- A lender creates many funding offers.
- A selected offer becomes a deal between one lender and one MSME.
- Each financial user has one wallet.
- A deal can have one call session.
- Risk analysis belongs to one invoice.

## Technology stack

### Client

- React 19
- Vite
- React Router
- Axios
- Tailwind CSS
- Framer Motion
- Recharts
- Socket.IO client
- jsPDF and jspdf-autotable

### Server

- Node.js
- Express
- Prisma
- PostgreSQL
- JSON Web Tokens
- bcryptjs
- Socket.IO
- Multer
- PDFKit
- Zod

## Running the project

### Requirements

- Node.js 20 or newer
- npm
- PostgreSQL

### Install

```powershell
cd server
npm install

cd ..\client
npm install
```

### Configure

Create `server/.env` with a PostgreSQL connection and application settings:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=5000
CLIENT_URL="http://localhost:5173"
```

The frontend can optionally use `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_API_URL=http://localhost:5000
```

Never commit either environment file.

### Prepare the database

```powershell
cd server
npx prisma generate
npx prisma migrate deploy
```

### Start the backend

```powershell
cd server
npm start
```

### Start the frontend

In a second terminal:

```powershell
cd client
npm run dev
```

Open `http://localhost:5173`. The backend health check is available at `http://localhost:5000/health`.

## Build and validation

```powershell
cd client
npm run build
npm run lint
```

```powershell
cd server
npm run build
```

The server package currently contains a placeholder test script, so automated backend test coverage should be added before production deployment.

## Current limitations and future improvements

FinSite is a strong academic/prototype foundation, but a production financial platform would need additional work:

- Integrate a real payment provider or banking workflow.
- Connect GST and business verification to trusted external services.
- Move recordings and uploaded documents to durable object storage.
- Add comprehensive automated API, integration, and browser tests.
- Add audit logs for financial and administrative actions.
- Harden authorization and agreement-signing rules.
- Add rate limiting, security headers, monitoring, and alerting.
- Improve transactional concurrency controls for wallet operations.
- Add formal compliance, privacy, and data-retention policies.
- Keep branding consistent between FinSite and any remaining legacy FinBridge labels.

## Final summary

FinSite demonstrates how invoice financing can be organized as a digital marketplace. It guides an MSME from verification to invoice submission, evaluates risk, collects lender offers, creates a funded deal, and tracks money and communication through completion. Its modular frontend, REST API, Prisma data model, wallet logic, risk engine, and real-time meeting support make it a useful foundation for an invoice-financing product prototype.
