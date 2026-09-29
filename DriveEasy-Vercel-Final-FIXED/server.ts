import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(process.cwd(), 'db.json');

app.use(express.json());

// Helper to read db.json
function readDb() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db.json:', err);
    return { vehicles: [], users: [], bookings: [] };
  }
}

// Helper to write db.json safely
function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing db.json:', err);
    return false;
  }
}

// ================= JSON SERVER COMPATIBLE REST API =================

// --- VEHICLES ---
function handleGetVehicles(req: Request, res: Response) {
  const db = readDb();
  let list = db.vehicles || [];

  const { category, type, fuel, transmission, search, available } = req.query;

  if (category && category !== 'all' && category !== 'All') {
    list = list.filter((v: any) => v.category?.toLowerCase() === String(category).toLowerCase());
  }
  if (type) {
    list = list.filter((v: any) => v.type?.toLowerCase() === String(type).toLowerCase());
  }
  if (fuel) {
    list = list.filter((v: any) => v.fuel?.toLowerCase() === String(fuel).toLowerCase());
  }
  if (transmission) {
    list = list.filter((v: any) => v.transmission?.toLowerCase() === String(transmission).toLowerCase());
  }
  if (available !== undefined) {
    list = list.filter((v: any) => String(v.available) === String(available));
  }
  if (search) {
    const q = String(search).toLowerCase().trim();
    list = list.filter((v: any) =>
      v.name?.toLowerCase().includes(q) ||
      v.brand?.toLowerCase().includes(q) ||
      v.model?.toLowerCase().includes(q) ||
      v.type?.toLowerCase().includes(q)
    );
  }

  res.json(list);
}

function handleGetVehicleById(req: Request, res: Response) {
  const db = readDb();
  const id = req.params.id;
  const vehicle = (db.vehicles || []).find((v: any) => String(v.id) === String(id));
  if (!vehicle) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }
  res.json(vehicle);
}

function handleAddVehicle(req: Request, res: Response) {
  const db = readDb();
  const newVehicle = req.body;
  if (!newVehicle.id) {
    newVehicle.id = Date.now();
  }
  if (newVehicle.available === undefined) {
    newVehicle.available = true;
  }
  db.vehicles = db.vehicles || [];
  db.vehicles.push(newVehicle);
  writeDb(db);
  res.status(201).json(newVehicle);
}

function handleUpdateVehicle(req: Request, res: Response) {
  const db = readDb();
  const id = req.params.id;
  const index = (db.vehicles || []).findIndex((v: any) => String(v.id) === String(id));
  if (index === -1) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }
  db.vehicles[index] = { ...db.vehicles[index], ...req.body, id: db.vehicles[index].id };
  writeDb(db);
  res.json(db.vehicles[index]);
}

function handleDeleteVehicle(req: Request, res: Response) {
  const db = readDb();
  const id = req.params.id;
  const initialLen = (db.vehicles || []).length;
  db.vehicles = (db.vehicles || []).filter((v: any) => String(v.id) !== String(id));
  if (db.vehicles.length === initialLen) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }
  writeDb(db);
  res.json({ success: true, message: 'Vehicle deleted successfully' });
}

app.get('/vehicles', handleGetVehicles);
app.get('/api/vehicles', handleGetVehicles);
app.get('/vehicles/:id', handleGetVehicleById);
app.get('/api/vehicles/:id', handleGetVehicleById);
app.post('/vehicles', handleAddVehicle);
app.post('/api/vehicles', handleAddVehicle);
app.put('/vehicles/:id', handleUpdateVehicle);
app.put('/api/vehicles/:id', handleUpdateVehicle);
app.patch('/vehicles/:id', handleUpdateVehicle);
app.patch('/api/vehicles/:id', handleUpdateVehicle);
app.delete('/vehicles/:id', handleDeleteVehicle);
app.delete('/api/vehicles/:id', handleDeleteVehicle);

// --- BOOKINGS ---
function handleGetBookings(req: Request, res: Response) {
  const db = readDb();
  let list = db.bookings || [];
  const { userId, status } = req.query;

  if (userId) {
    list = list.filter((b: any) => String(b.userId) === String(userId));
  }
  if (status && status !== 'all' && status !== 'All') {
    list = list.filter((b: any) => b.status?.toLowerCase() === String(status).toLowerCase());
  }
  res.json(list);
}

function handleGetBookingById(req: Request, res: Response) {
  const db = readDb();
  const id = req.params.id;
  const booking = (db.bookings || []).find((b: any) => String(b.id).toUpperCase() === String(id).toUpperCase());
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  res.json(booking);
}

function handleCreateBooking(req: Request, res: Response) {
  const db = readDb();
  const newBooking = req.body;
  if (!newBooking.id) {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    newBooking.id = `VR${randomNum}`;
  }
  if (!newBooking.bookingDate) {
    newBooking.bookingDate = new Date().toISOString();
  }
  if (!newBooking.status) {
    newBooking.status = 'Confirmed';
  }
  db.bookings = db.bookings || [];
  db.bookings.unshift(newBooking);

  // If vehicle is booked, optional availability update
  if (newBooking.vehicleId) {
    const vIdx = (db.vehicles || []).findIndex((v: any) => String(v.id) === String(newBooking.vehicleId));
    if (vIdx !== -1) {
      db.vehicles[vIdx].available = false;
    }
  }

  writeDb(db);
  res.status(201).json(newBooking);
}

function handleUpdateBooking(req: Request, res: Response) {
  const db = readDb();
  const id = req.params.id;
  const index = (db.bookings || []).findIndex((b: any) => String(b.id).toUpperCase() === String(id).toUpperCase());
  if (index === -1) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  db.bookings[index] = { ...db.bookings[index], ...req.body, id: db.bookings[index].id };

  // If booking cancelled, restore vehicle availability
  if (req.body.status === 'Cancelled' && db.bookings[index].vehicleId) {
    const vIdx = (db.vehicles || []).findIndex((v: any) => String(v.id) === String(db.bookings[index].vehicleId));
    if (vIdx !== -1) {
      db.vehicles[vIdx].available = true;
    }
  }

  writeDb(db);
  res.json(db.bookings[index]);
}

function handleDeleteBooking(req: Request, res: Response) {
  const db = readDb();
  const id = req.params.id;
  const initialLen = (db.bookings || []).length;
  db.bookings = (db.bookings || []).filter((b: any) => String(b.id).toUpperCase() !== String(id).toUpperCase());
  if (db.bookings.length === initialLen) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  writeDb(db);
  res.json({ success: true, message: 'Booking deleted successfully' });
}

app.get('/bookings', handleGetBookings);
app.get('/api/bookings', handleGetBookings);
app.get('/bookings/:id', handleGetBookingById);
app.get('/api/bookings/:id', handleGetBookingById);
app.post('/bookings', handleCreateBooking);
app.post('/api/bookings', handleCreateBooking);
app.put('/bookings/:id', handleUpdateBooking);
app.put('/api/bookings/:id', handleUpdateBooking);
app.patch('/bookings/:id', handleUpdateBooking);
app.patch('/api/bookings/:id', handleUpdateBooking);
app.delete('/bookings/:id', handleDeleteBooking);
app.delete('/api/bookings/:id', handleDeleteBooking);

// --- USERS & AUTH ---
function handleGetUsers(req: Request, res: Response) {
  const db = readDb();
  let list = db.users || [];
  const { email, password, role } = req.query;

  if (email) {
    list = list.filter((u: any) => u.email?.toLowerCase() === String(email).toLowerCase());
  }
  if (password) {
    list = list.filter((u: any) => u.password === String(password));
  }
  if (role) {
    list = list.filter((u: any) => u.role?.toLowerCase() === String(role).toLowerCase());
  }
  res.json(list);
}

function handleGetUserById(req: Request, res: Response) {
  const db = readDb();
  const id = req.params.id;
  const user = (db.users || []).find((u: any) => String(u.id) === String(id));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
}

function handleRegisterUser(req: Request, res: Response) {
  const db = readDb();
  const { name, email, phone, password, role } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const existing = (db.users || []).find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'User with this email already exists' });
  }

  const newUser = {
    id: Date.now(),
    name,
    email,
    phone: phone || '',
    password,
    role: role || 'user'
  };

  db.users = db.users || [];
  db.users.push(newUser);
  writeDb(db);
  res.status(201).json(newUser);
}

function handleLogin(req: Request, res: Response) {
  const { email, password } = req.body;
  const db = readDb();
  const user = (db.users || []).find(
    (u: any) => u.email?.toLowerCase() === (email || '').toLowerCase() && u.password === password
  );
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json(user);
}

app.get('/users', handleGetUsers);
app.get('/api/users', handleGetUsers);
app.get('/users/:id', handleGetUserById);
app.get('/api/users/:id', handleGetUserById);
app.post('/users', handleRegisterUser);
app.post('/api/users', handleRegisterUser);
app.post('/login', handleLogin);
app.post('/api/login', handleLogin);

// --- STATIC FILES & PAGE ROUTING ---
app.use(express.static(process.cwd()));

app.get('/', (_req: Request, res: Response) => {
  res.redirect('/views/index.html');
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true }
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn('Vite middleware initialization skipped or running standalone', e);
    }
  }

  app.listen(PORT, () => {
    console.log(`DriveEasy Vehicle Rental Server running on port ${PORT}`);
  });
}

startServer();
