# REVORA — Complete Responsive Full-Stack Web Application

> **Connect Resources. Create Opportunities.**
> Primary Market: Bhimavaram, West Godavari, Andhra Pradesh & India.

---

## 🌟 Application Overview

**REVORA** is a full-stack, responsive web application engineered to discover and exchange community resources, access agricultural machinery, buy farm produce directly from growers, and book certified home services.

The platform addresses four core community verticals:
1. **Farm Equipment Rental:** Tractors, combined harvesters, power tillers, sprayers, and seed drills with collision-free booking calendar safeguards.
2. **Farm-to-Consumer Marketplace:** Fresh produce (Godavari Sona Masoori aged rice, Banganapalli sweet mangoes, organic tomatoes, A2 cow ghee) with atomic inventory management.
3. **General Equipment & Resource Sharing:** Occasional household resources (hammer drills, 14ft ladders, high-pressure washers, tile cutters) avoiding idle asset purchase costs.
4. **Local Home Services:** Skilled electricians, AC & appliance repair technicians, plumbers, and carpenters with upfront visiting rates and genuine verified reviews.

---

## 🚀 Technology Stack

- **Frontend:**
  - Semantic HTML5, CSS3, JavaScript (ES6+)
  - **Bootstrap 5.3.3** (Responsive grid, navigation, modals, offcanvas drawers, cards, badges, dropdowns, forms)
  - **Bootstrap Icons 1.11.3**
  - Custom Brand Design System tokens (`#174D3A` Forest Green, `#10382C` Deep Green, `#FAF8F1` Warm Ivory, `#DDE9DF` Sage, `#C8A45D` Muted Gold)
  - Mobile bottom navigation bar for quick smartphone navigation
- **Backend:**
  - Node.js & Express.js REST API
  - JWT (JSON Web Tokens) Authentication
  - Bcrypt password hashing
  - Server-side role authorization & validation
- **Database:**
  - SQLite with `better-sqlite3` (WAL mode enabled, foreign keys enforced)
  - Schema covering Users, Categories, Equipment Listings, Bookings, Marketplace Products, Produce Orders, Order Items, Service Providers, Appointments, Reviews, and Notifications.

---

## 📦 Project Setup & Installation

### 1. Prerequisites
- Node.js (v18+ or v20+)
- npm

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
PORT=5000
JWT_SECRET=revora_secure_secret_key_bhimavaram_2025_ap
NODE_ENV=development
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Seed the Database
Populate the database with realistic demonstration data for Bhimavaram:
```bash
npm run seed
```

### 5. Run Automated Tests
Execute the 26-test verification suite covering schema, auth, booking conflict prevention, transactions, and reviews:
```bash
npm run test
```

### 6. Start the Server
```bash
npm start
# or development with auto-reload:
npm run dev
```

The web application will be live at:
**[http://localhost:5000](http://localhost:5000)**

---

## 🔑 Demonstration Accounts

All demo accounts use password: `demo1234` (with one-click autofill buttons available on `/auth.html`):

| Role | Email | Password | Primary Feature Access |
|---|---|---|---|
| **Customer** | `customer@revora.local` | `demo1234` | Rent machines, buy farm produce, book home services |
| **Farmer** | `farmer@revora.local` | `demo1234` | List crops/produce, manage stock, process incoming orders |
| **Equipment Owner** | `owner@revora.local` | `demo1234` | List tractors/tools, approve/reject rental requests |
| **Service Provider** | `service@revora.local` | `demo1234` | Receive callouts, accept/decline service visits |
| **Administrator** | `admin@revora.local` | `demo1234` | Full access, user directory, system-wide metrics |

---

## 🛡️ Business Rules & Integrity Guarantees

1. **Double-Booking Collision Prevention:** The server verifies incoming equipment rental dates against existing approved reservations. Overlapping booking attempts are rejected with `409 Conflict`.
2. **Atomic Inventory Safeguards:** When customers check out from the cart, database transactions decrement stock levels in real time to prevent overselling.
3. **Authentic Ground-Truth Reviews:** Reviews are linked to completed booking and order IDs.
4. **Transparent Demo Labeling:** Demo records are marked with distinctive badges to prevent misleading claims.
