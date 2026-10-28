# FinSite

FinSite is a full-stack invoice-financing marketplace that connects micro, small, and medium enterprises (MSMEs) with verified lenders. MSMEs can submit invoices and request working capital, while lenders can review eligible invoices, create funding offers, and manage active deals.

The project is implemented as a React single-page application with a Node.js/Express API and a PostgreSQL database managed through Prisma.

## What the platform does

The main business flow is:

1. A user registers as an MSME or lender.
2. The MSME submits business KYC information.
3. An administrator reviews and verifies the MSME.
4. The verified MSME submits an invoice.
5. The backend validates the invoice and calculates credit and fraud-risk scores.
6. Eligible invoices become available to verified lenders.
7. A lender creates a funding offer using the lender wallet.
8. The MSME accepts an offer.
9. The accepted offer becomes a deal and the wallet balances are updated.
10. The parties can review/sign a digital agreement, track repayment, and use the deal meeting feature.

## User roles

- **MSME** — submits KYC, uploads invoices, reviews offers, and tracks funding.
- **Lender** — completes lender verification, funds invoices, and manages investments.
- **Admin** — reviews MSME/lender verification, monitors deals, and views dashboard statistics.
- **Controller** — manages runtime feature flags through the system-control area.

## Main features

- Role-based registration, login, and protected routes
- MSME KYC and lender verification workflows
- Invoice submission and invoice history
- Rules-based credit and fraud-risk assessment
- Funding offers and offer acceptance
- Wallet balances, locked funds, earnings, and activity history
- Deal lifecycle and repayment processing
- PDF invoice downloads and digital agreement generation
- Admin dashboard, verification queues, and deal monitoring
- Feature flags for selectively enabling platform modules
- WebRTC video calls, Socket.IO signaling, chat, and call recordings
- Analytics and profile pages

## Technology stack

### Frontend

- React 19
- Vite
- React Router
- Axios
- Tailwind CSS
- Framer Motion
- Recharts
- Socket.IO client
- jsPDF and jspdf-autotable

### Backend

- Node.js
- Express
- Prisma ORM
- PostgreSQL
- JSON Web Tokens
- bcryptjs
- Socket.IO
- Multer
- PDFKit
- Zod

## Project structure

```text
.
├── client/                 React/Vite frontend
│   ├── src/api/             API clients
│   ├── src/components/      Shared and admin UI components
│   ├── src/context/         Auth, theme, and feature-flag state
│   ├── src/pages/           Landing, auth, dashboard, KYC, wallet, and deal pages
│   ├── src/styles/          Application stylesheets
│   └── src/utils/           Frontend utilities such as invoice PDF generation
└── server/                 Express/Prisma backend
    ├── config/              Prisma and application configuration
    ├── controllers/         Request handlers
    ├── middleware/          Auth, role, feature, and error middleware
    ├── prisma/              Prisma schema and migrations
    ├── routes/               REST API route definitions
    ├── services/             Risk, auth, KYC, sockets, and business services
    ├── uploads/              Local call-recording storage
    └── validators/           Request validation
```

## Database model

The Prisma schema uses PostgreSQL and includes entities for:

- Users and roles
- MSME KYC and lender profiles
- Invoices, bids, offers, and transactions
- Credit scores, fraud flags, and invoice risk analyses
- Deals and digital agreement status
- Wallets
- Call sessions
- Runtime feature flags

The database URL is read from `server/.env` through `DATABASE_URL`. Do not commit `.env` files or database credentials.

## Local setup

### Requirements

- Node.js 20 or newer
- npm
- PostgreSQL database

### Install dependencies

```powershell
cd server
npm install

cd ..\client
npm install
```

### Configure the backend

Create `server/.env` with values appropriate for the local environment:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=5000
CLIENT_URL="http://localhost:5173"
```

The application may use additional environment variables for optional integrations. Keep those values local and never publish credentials.

### Prepare Prisma

```powershell
cd server
npx prisma generate
npx prisma migrate deploy
```

Use `npx prisma db push` only when intentionally synchronizing a development database without migration history.

### Run the application

Start the backend:

```powershell
cd server
npm start
```

Start the frontend in a second terminal:

```powershell
cd client
npm run dev
```

The frontend is normally available at `http://localhost:5173`. The backend health endpoint is `http://localhost:5000/health`.

## Validation commands

```powershell
cd client
npm run build
npm run lint
```

```powershell
cd server
npm run build
```

The server package currently does not contain an automated test suite; `npm test` is still the default placeholder command.

## Risk assessment behavior

The invoice risk engine is currently rules-based rather than a trained machine-learning model. It considers business age, annual turnover, GST verification status, invoice exposure, recent invoice spikes, round-number patterns, age-to-invoice mismatch, and duplicate invoice checks.

It stores a credit score, fraud score, fraud probability, final risk-adjusted score, risk bands, and a detailed breakdown. Invoices with high fraud risk or a low final score remain pending; otherwise they can be opened for funding.

## Important scope notes

- Wallet operations update application balances; no external payment gateway is currently shown in the implementation.
- GST verification is represented through the platform's KYC and risk workflow; no live external GST service integration is currently shown.
- Call recordings are stored under the server's local uploads directory unless deployment configuration provides another storage solution.
- The project is a working academic/prototype platform and should receive production security, payment, document-storage, audit, and compliance hardening before real financial use.

## Project documentation

For a blog-ready explanation of the product idea, user journeys, architecture, and implementation details, see [client/PROJECT_BLOG.md](client/PROJECT_BLOG.md).

## Deployment: Vercel + Render

The repository includes [render.yaml](render.yaml) for deploying the API from the `server` directory on Render and [client/vercel.json](client/vercel.json) for client-side routing on Vercel.

### Deploy the backend to Render

1. Push the repository to GitHub.
2. In Render, create a **Blueprint** from the repository, or create a Node Web Service with `server` as its root directory.
3. Use the build command `npm install && npx prisma generate`.
4. Use the start command `npm start`.
5. Add these environment variables in Render:
   - `DATABASE_URL` — the production PostgreSQL/Neon connection string.
   - `JWT_SECRET` — a new long random secret; do not reuse a committed secret.
   - `JWT_EXPIRES_IN` — for example `30d`.
   - `CLIENT_URL` — the Vercel URL. Multiple origins may be comma-separated.
   - `NODE_ENV=production`.
6. Confirm `https://YOUR-RENDER-SERVICE.onrender.com/health` returns `{"status":"running"}`.

### Deploy the frontend to Vercel

1. Import the same repository into Vercel.
2. Set the project root directory to `client`.
3. Use `npm run build` as the build command and `dist` as the output directory.
4. Add:
   - `VITE_API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com/api`
   - `VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com`
5. Redeploy after saving the environment variables.
6. Copy the resulting Vercel URL into Render's `CLIENT_URL` and redeploy the backend.

Do not upload `server/.env` or put database passwords, JWT secrets, or TURN credentials in the repository. Use [client/.env.example](client/.env.example) and [server/.env.example](server/.env.example) as templates.
