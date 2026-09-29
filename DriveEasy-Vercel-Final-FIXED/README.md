# DriveEasy - Vehicle Rental System

> **Tagline:** Rent Your Ride, Your Way  
> **Course / Project Type:** Web Application / College Project  
> **Tech Stack:** HTML5, CSS3, Vanilla JavaScript, JavaScript DOM manipulation, Axios, and JSON Server backend.

---

## 🚀 Overview

**DriveEasy** is a complete, production-grade vehicle rental web application engineered strictly with clean semantic HTML5, modular CSS3, Vanilla JavaScript, and Axios service communication backed by a JSON Server REST API (`db.json`).

The UI visual design directly reproduces the high-fidelity Google Stitch mobile and desktop designs with pixel-level precision.

---

## 📁 Project Structure

```text
vehicle-rental/
│
├── views/
│   ├── index.html              # Home page with hero, search pod, categories & popular rides
│   ├── vehicles.html           # Vehicle listing with search, category pills & drawer filters
│   ├── vehicle-details.html    # Detailed vehicle specs, gallery carousel & date checker
│   ├── booking.html            # Step 3 checkout flow with real-time price calculation
│   ├── confirmation.html       # Booking confirmation with summary receipt & copy ID
│   ├── my-bookings.html        # Customer booking management with status tabs & cancellation
│   ├── login.html              # User & admin sign in
│   ├── register.html           # New user registration with form validation
│   ├── dashboard.html          # Admin dashboard with 2x2 metric bento & recent bookings
│   ├── manage-vehicles.html    # Admin fleet management (Add, Edit, Delete, Toggle Availability)
│   ├── manage-bookings.html    # Admin reservation management (Status updates & cancellation)
│   └── manage-users.html       # Admin customer & user accounts directory
│
├── css/
│   ├── style.css               # Design system tokens, header, navigation & shared components
│   ├── home.css                # Home page hero banner, search pod, & category cards
│   ├── vehicles.css            # Vehicle listing cards, filter drawer, & spec chips
│   ├── details.css             # Carousel gallery, specs grid, & sticky bottom bar
│   ├── booking.css             # Checkout fare breakdown, forms, & payment selector
│   ├── bookings.css            # My bookings cards & cancel modal
│   ├── auth.css                # Twilight hero, login/register tabs, & trust badges
│   └── dashboard.css           # 2x2 stat cards, CSS chart, & data tables
│
├── js/
│   ├── main.js                 # Global navbar active state & user session handling
│   ├── home.js                 # Dynamic popular vehicles loading & search handler
│   ├── vehicles.js             # Client-side vehicle filtering, search, & sorting
│   ├── vehicle-details.js      # URL param parser, image gallery, & availability checker
│   ├── booking.js              # Real-time rental formula calculation & booking submission
│   ├── my-bookings.js          # User reservations filter & cancel workflow
│   ├── auth.js                 # Login/registration logic & password visibility toggles
│   ├── dashboard.js            # Admin analytics calculations & chart synchronization
│   ├── manage-vehicles.js      # Fleet CRUD operations via vehicleService
│   ├── manage-bookings.js      # Booking status updates & cancellation
│   ├── manage-users.js         # User registration & directory management
│   └── utils.js                # Currency formatting, date parsing, & rental formula
│
│   └── service/
│       ├── apiConfig.js        # JSON Server base URL configuration
│       ├── vehicleService.js   # Vehicle REST API operations (get, add, update, delete)
│       ├── bookingService.js   # Booking REST API operations (get, create, cancel)
│       └── userService.js      # User REST API operations (get, login, register)
│
├── exception/
│   ├── apiException.js         # Standardized Axios network and HTTP error processing
│   └── validationException.js  # Form input and date validation helpers
│
├── assets/
│   ├── images/                 # Static local images
│   └── icons/                  # Static icon assets
│
├── db.json                     # JSON Server database (Vehicles, Users, Bookings)
├── server.ts                   # Express server hosting JSON Server REST endpoints + static files
└── package.json
```

---

## ⚡ Features Implemented

### 🚗 Customer Features
1. **Home Page**:
   - Hero banner with cinematic highway vehicle background.
   - Quick rental search pod (Pickup Location, Start Date, End Date).
   - Vehicle category cards (Cars, Bikes, Scooters, Vans) with vehicle counts.
   - Popular vehicles loaded dynamically from `vehicleService`.
   - DriveEasy Guarantee card (Zero Deposit, Sanitized, 24/7 Assist).
2. **Browse Vehicles**:
   - Dynamic vehicle listing cards loaded via `vehicleService.getVehicles()`.
   - Real-time text search (name, brand, model, type).
   - Category filter pills (All, Cars, Bikes, Scooters, SUVs, Vans).
   - Collapsible filter drawer (Price range, Fuel type, Transmission).
   - Dynamic sorting (Price Low to High, Price High to Low, Rating).
   - Favorite heart toggle micro-interaction.
3. **Vehicle Details**:
   - Loaded by URL parameter: `vehicle-details.html?id=VEHICLE_ID`.
   - Interactive image carousel with thumbnails and pagination dots.
   - Full technical specifications (Brand, Model, Fuel, Gearbox, Capacity, Mileage).
   - Interactive rental date selector and "Check Availability" validator.
   - Hub location map preview card.
   - Sticky bottom bar with live total calculation and "Rent Now" action.
4. **Booking System & Checkout Flow**:
   - Automatically loaded by vehicle ID with pre-selected dates.
   - Dynamic real-time calculation according to the exact project formula:
     $$\text{Rental Days} = \text{Return Date} - \text{Pickup Date}$$
     $$\text{Base Price} = \text{Rental Days} \times \text{Price Per Day}$$
     $$\text{Tax} = 10\% \text{ of Base Price}$$
     $$\text{Total Amount} = \text{Base Price} + \text{Tax}$$
   - Interactive payment method selector (Cash, UPI, Card).
   - Comprehensive form validation via `validationException.js`.
   - Persists booking via `bookingService.createBooking()`.
5. **Confirmation Page**:
   - Animated green success checkmark.
   - Auto-generated Booking ID (`VR10245`) with one-click copy button.
   - Detailed trip and financial breakdown.
   - Direct navigation to "View My Bookings" and "Go Home".
6. **My Bookings**:
   - Filter by status tabs: All, Active, Confirmed, Completed, Cancelled.
   - Interactive "Cancel Booking" with confirmation modal.
   - Real-time status update to "Cancelled" via `bookingService.cancelBooking()`.
7. **Authentication (Login & Register)**:
   - Full form validation (email format, 10-digit phone, password confirmation).
   - Duplicate email prevention.
   - User session management via `localStorage`.

### 🛡️ Admin Features
8. **Admin Dashboard**:
   - Dynamic live calculations for:
     * **Total Fleet** (count of all vehicles in `db.json`)
     * **Ready to Rent** (available vehicles count + rate percentage)
     * **Total Bookings** (total reservations count)
     * **Net Revenue** (cumulative sum of all non-cancelled bookings)
   - Booking Trajectory monthly performance visualization.
   - Recent Bookings activity ledger with direct view links.
   - Real-time fleet utilization progress bar.
9. **Fleet Management (`manage-vehicles.html`)**:
   - Add new vehicle modal with full spec inputs.
   - Edit vehicle details.
   - Instant availability toggle (Available / Unavailable).
   - Delete vehicle with safety confirmation.
10. **Booking Management (`manage-bookings.html`)**:
    - Search by ID, customer name, or vehicle.
    - Filter by status.
    - Update booking status (Confirmed, Active, Completed, Cancelled).
    - Cancel booking action.
11. **User Management (`manage-users.html`)**:
    - Directory of all registered users and administrators.
    - Search by name, email, or phone.
    - Add new user modal with role assignment.

---

## 🔐 Sample Credentials for Testing

| Role | Email | Password |
| :--- | :--- | :--- |
| **Customer** | `rahul@example.com` | `password123` |
| **Administrator** | `admin@driveeasy.com` | `admin123` |

---

## 🛠️ REST API Endpoints (`server.ts` & `db.json`)

- `GET /vehicles` - Query vehicles (supports `category`, `type`, `fuel`, `transmission`, `search`, `available`)
- `GET /vehicles/:id` - Fetch single vehicle
- `POST /vehicles` - Add new vehicle
- `PUT /vehicles/:id` - Update vehicle
- `DELETE /vehicles/:id` - Remove vehicle
- `GET /bookings` - Query bookings (supports `userId`, `status`)
- `GET /bookings/:id` - Fetch single booking
- `POST /bookings` - Create reservation
- `PATCH /bookings/:id` - Update booking status / cancel
- `GET /users` - Query user accounts
- `POST /users` - Register user
- `POST /login` - Sign in validation
