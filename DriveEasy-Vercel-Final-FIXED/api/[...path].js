import fs from 'node:fs';
import path from 'node:path';

const DB_PATH = path.join(process.cwd(), 'db.json');

function readDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (err) {
    console.error('Error reading db.json:', err);
    return { vehicles: [], users: [], bookings: [] };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing db.json:', err);
    return false;
  }
}

function send(res, status, data) {
  res.status(status).json(data);
}

function getPathParts(req) {
  const raw = (req.url || '').split('?')[0].replace(/^\/api\/?/, '').replace(/\/$/, '');
  return raw ? raw.split('/') : [];
}

function query(req) {
  const raw = (req.url || '').split('?')[1] || '';
  return new URLSearchParams(raw);
}

export default async function handler(req, res) {
  const parts = getPathParts(req);
  const resource = parts[0];
  const id = parts[1];
  const method = req.method || 'GET';
  const q = query(req);
  const db = readDb();

  try {
    // VEHICLES
    if (resource === 'vehicles') {
      if (method === 'GET') {
        let list = db.vehicles || [];
        const category = q.get('category');
        const type = q.get('type');
        const fuel = q.get('fuel');
        const transmission = q.get('transmission');
        const search = q.get('search');
        const available = q.get('available');

        if (id) {
          const vehicle = list.find(v => String(v.id) === String(id));
          return vehicle ? send(res, 200, vehicle) : send(res, 404, { error: 'Vehicle not found' });
        }
        if (category && !['all', 'All'].includes(category)) list = list.filter(v => v.category?.toLowerCase() === category.toLowerCase());
        if (type) list = list.filter(v => v.type?.toLowerCase() === type.toLowerCase());
        if (fuel) list = list.filter(v => v.fuel?.toLowerCase() === fuel.toLowerCase());
        if (transmission) list = list.filter(v => v.transmission?.toLowerCase() === transmission.toLowerCase());
        if (available !== null) list = list.filter(v => String(v.available) === String(available));
        if (search) {
          const s = search.toLowerCase().trim();
          list = list.filter(v => v.name?.toLowerCase().includes(s) || v.brand?.toLowerCase().includes(s) || v.model?.toLowerCase().includes(s) || v.type?.toLowerCase().includes(s));
        }
        return send(res, 200, list);
      }

      if (method === 'POST' && !id) {
        const body = req.body || {};
        const newVehicle = { ...body, id: body.id || Date.now(), available: body.available === undefined ? true : body.available };
        db.vehicles = db.vehicles || [];
        db.vehicles.push(newVehicle);
        writeDb(db);
        return send(res, 201, newVehicle);
      }

      if (id && ['PUT', 'PATCH'].includes(method)) {
        const index = (db.vehicles || []).findIndex(v => String(v.id) === String(id));
        if (index === -1) return send(res, 404, { error: 'Vehicle not found' });
        db.vehicles[index] = { ...db.vehicles[index], ...(req.body || {}), id: db.vehicles[index].id };
        writeDb(db);
        return send(res, 200, db.vehicles[index]);
      }

      if (id && method === 'DELETE') {
        const before = (db.vehicles || []).length;
        db.vehicles = (db.vehicles || []).filter(v => String(v.id) !== String(id));
        if (db.vehicles.length === before) return send(res, 404, { error: 'Vehicle not found' });
        writeDb(db);
        return send(res, 200, { success: true, message: 'Vehicle deleted successfully' });
      }
    }

    // BOOKINGS
    if (resource === 'bookings') {
      if (method === 'GET') {
        const list0 = db.bookings || [];
        if (id) {
          const booking = list0.find(b => String(b.id).toUpperCase() === String(id).toUpperCase());
          return booking ? send(res, 200, booking) : send(res, 404, { error: 'Booking not found' });
        }
        let list = list0;
        const userId = q.get('userId');
        const status = q.get('status');
        if (userId) list = list.filter(b => String(b.userId) === String(userId));
        if (status && !['all', 'All'].includes(status)) list = list.filter(b => b.status?.toLowerCase() === status.toLowerCase());
        return send(res, 200, list);
      }

      if (method === 'POST' && !id) {
        const body = req.body || {};
        const newBooking = { ...body, id: body.id || `VR${Math.floor(10000 + Math.random() * 90000)}`, bookingDate: body.bookingDate || new Date().toISOString(), status: body.status || 'Confirmed' };
        db.bookings = db.bookings || [];
        db.bookings.unshift(newBooking);
        if (newBooking.vehicleId) {
          const v = (db.vehicles || []).find(v => String(v.id) === String(newBooking.vehicleId));
          if (v) v.available = false;
        }
        writeDb(db);
        return send(res, 201, newBooking);
      }

      if (id && ['PUT', 'PATCH'].includes(method)) {
        const index = (db.bookings || []).findIndex(b => String(b.id).toUpperCase() === String(id).toUpperCase());
        if (index === -1) return send(res, 404, { error: 'Booking not found' });
        db.bookings[index] = { ...db.bookings[index], ...(req.body || {}), id: db.bookings[index].id };
        if (req.body?.status === 'Cancelled' && db.bookings[index].vehicleId) {
          const v = (db.vehicles || []).find(v => String(v.id) === String(db.bookings[index].vehicleId));
          if (v) v.available = true;
        }
        writeDb(db);
        return send(res, 200, db.bookings[index]);
      }

      if (id && method === 'DELETE') {
        const before = (db.bookings || []).length;
        db.bookings = (db.bookings || []).filter(b => String(b.id).toUpperCase() !== String(id).toUpperCase());
        if (db.bookings.length === before) return send(res, 404, { error: 'Booking not found' });
        writeDb(db);
        return send(res, 200, { success: true, message: 'Booking deleted successfully' });
      }
    }

    // USERS
    if (resource === 'users') {
      if (method === 'GET') {
        let list = db.users || [];
        if (id) {
          const user = list.find(u => String(u.id) === String(id));
          return user ? send(res, 200, user) : send(res, 404, { error: 'User not found' });
        }
        const email = q.get('email');
        const password = q.get('password');
        const role = q.get('role');
        if (email) list = list.filter(u => u.email?.toLowerCase() === email.toLowerCase());
        if (password) list = list.filter(u => u.password === password);
        if (role) list = list.filter(u => u.role?.toLowerCase() === role.toLowerCase());
        return send(res, 200, list);
      }
      if (method === 'POST' && !id) {
        const { name, email, phone, password, role } = req.body || {};
        if (!email || !password || !name) return send(res, 400, { error: 'Name, email, and password are required' });
        if ((db.users || []).some(u => u.email?.toLowerCase() === email.toLowerCase())) return send(res, 409, { error: 'User with this email already exists' });
        const newUser = { id: Date.now(), name, email, phone: phone || '', password, role: role || 'user' };
        db.users = db.users || [];
        db.users.push(newUser);
        writeDb(db);
        return send(res, 201, newUser);
      }
    }

    // LOGIN
    if (resource === 'login' && method === 'POST') {
      const { email, password } = req.body || {};
      const user = (db.users || []).find(u => u.email?.toLowerCase() === (email || '').toLowerCase() && u.password === password);
      return user ? send(res, 200, user) : send(res, 401, { error: 'Invalid email or password' });
    }

    return send(res, 404, { error: 'API endpoint not found' });
  } catch (error) {
    console.error(error);
    return send(res, 500, { error: 'Internal server error' });
  }
}
