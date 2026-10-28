# FinSite Frontend

This folder contains the React/Vite frontend for **FinSite**, an invoice-financing marketplace for MSMEs and lenders.

The frontend provides:

- Public landing, login, and registration pages
- Role-based MSME, lender, admin, and controller experiences
- KYC and lender-verification forms
- Invoice upload and invoice listing pages
- Offer, deal, wallet, analytics, and profile pages
- Digital agreement and invoice PDF download actions
- Meeting-room UI for deal-based video calls and chat

## Run the frontend

From this directory:

```powershell
npm install
npm run dev
```

The Vite development server normally runs at `http://localhost:5173`.

The frontend uses these development API defaults:

- REST API: `http://localhost:5000/api`
- Socket.IO server: `http://localhost:5000`

To override them, create a local `client/.env` file:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_API_URL=http://localhost:5000
```

Do not commit `.env` files or credentials.

## Build and lint

```powershell
npm run build
npm run lint
```

## Frontend flow

1. `App.jsx` registers the routes and applies public/protected role guards.
2. `AuthContext` restores the current session and stores the authentication token.
3. API modules under `src/api` call the Express backend.
4. Context providers manage authentication, theme, and feature flags.
5. Pages render the business workflows for each role.
6. Socket.IO and WebRTC support the deal meeting experience.

## Blog summary

FinSite's frontend is the user-facing layer of a digital invoice-financing marketplace. It guides an MSME from registration and KYC through invoice submission, risk review, lender offers, funding, wallet tracking, and deal completion. Lenders use a separate dashboard to review opportunities and fund invoices, while administrators manage verification and platform oversight.

For the complete project explanation, see the root [README.md](../README.md) and [PROJECT_BLOG.md](PROJECT_BLOG.md).
