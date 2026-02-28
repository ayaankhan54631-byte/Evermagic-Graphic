import express from 'express';
import { createServer as createViteServer } from 'vite';
import pg from 'pg'; // The Cloud Connector
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
console.log('Starting Evermagic Graphic Cloud Server...');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. CONNECT TO THE MAGIC CLOUD
// This looks for the secret link you put in the GitHub settings
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 2. MAKE THE TABLES IN THE CLOUD
async function initializeDatabase() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT
      );

      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        type TEXT DEFAULT 'retail'
      );

      CREATE TABLE IF NOT EXISTS customer_rates (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        material TEXT,
        rate REAL,
        UNIQUE(customer_id, material)
      );

      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        material TEXT UNIQUE,
        stock_sqft REAL,
        min_stock REAL,
        rate REAL,
        buy_rate REAL DEFAULT 0,
        is_for_sale INTEGER DEFAULT 1,
        unit TEXT DEFAULT 'sqft'
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number TEXT UNIQUE,
        customer_id INTEGER REFERENCES customers(id),
        customer_name TEXT,
        material TEXT,
        length REAL,
        breadth REAL,
        qty INTEGER,
        sqft REAL,
        rate_per_sqft REAL,
        unit TEXT DEFAULT 'sqft',
        pasting_charges REAL DEFAULT 0,
        led_work REAL DEFAULT 0,
        frame_charges REAL DEFAULT 0,
        total_amount REAL,
        payment_received REAL DEFAULT 0,
        payment_due REAL,
        status TEXT DEFAULT 'designing',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Magic Cloud Database is ready! ☁️');
    
    // Seed Admin User
    await db.query(`
      INSERT INTO users (username, password, role) 
      VALUES ('Ayaankhan', 'ayaanwhite123', 'admin')
      ON CONFLICT (username) DO NOTHING
    `);
  } catch (error) {
    console.error('Database setup failed:', error);
  }
}

async function startServer() {
  await initializeDatabase();
  const app = express();
  app.use(express.json());

  // --- API ROUTES ---

  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const result = await db.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1) AND password = $2', [username, password]);
    const user = result.rows[0];
    
    if (user) {
      res.json({ token: 'mock-jwt-token', user: { id: user.id, username: user.username, role: user.role } });
    } else {
      res.status(401).json({ detail: 'Invalid credentials' });
    }
  });

  app.get('/api/customers', async (req, res) => {
    const result = await db.query('SELECT * FROM customers');
    res.json(result.rows);
  });

  app.post('/api/customers', async (req, res) => {
    const { name, phone, email, address, type } = req.body;
    const result = await db.query(
      'INSERT INTO customers (name, phone, email, address, type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, phone, email, address, type || 'retail']
    );
    res.json(result.rows[0]);
  });

  app.get('/api/inventory', async (req, res) => {
    const result = await db.query('SELECT * FROM inventory');
    res.json(result.rows);
  });

  app.post('/api/orders', async (req, res) => {
    const data = req.body;
    const order_number = 'ORD-' + Date.now();
    const sqft = data.length * data.breadth * data.qty;
    const total_amount = (data.unit === 'piece' ? (data.qty * data.rate_per_sqft) : (sqft * data.rate_per_sqft)) + 
                         (Number(data.pasting_charges) || 0) + (Number(data.led_work) || 0) + (Number(data.frame_charges) || 0);
    
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(`
        INSERT INTO orders (
          order_number, customer_id, customer_name, material, length, breadth, qty, sqft, 
          rate_per_sqft, unit, pasting_charges, led_work, frame_charges, total_amount, payment_due, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *
      `, [order_number, data.customer_id, data.customer_name, data.material, data.length, data.breadth, 
          data.qty, sqft, data.rate_per_sqft, data.unit || 'sqft', data.pasting_charges, data.led_work, data.frame_charges, 
          total_amount, total_amount, data.notes]);

      await client.query('UPDATE inventory SET stock_sqft = stock_sqft - $1 WHERE material = $2', [sqft, data.material]);
      await client.query('COMMIT');
      res.json(result.rows[0]);
    } catch (e) {
      await client.query('ROLLBACK');
      res.status(500).json({ detail: 'Order failed' });
    } finally {
      client.release();
    }
  });

  app.get('/api/dashboard/stats', async (req, res) => {
    const revenue = await db.query("SELECT SUM(total_amount) as val FROM orders WHERE date(created_at) = CURRENT_DATE");
    const pending = await db.query("SELECT COUNT(*) as val FROM orders WHERE status != 'completed'");
    const lowStock = await db.query("SELECT COUNT(*) as val FROM inventory WHERE stock_sqft < min_stock");
    
    res.json({
      total_revenue: revenue.rows[0].val || 0,
      pending_orders: pending.rows[0].val || 0,
      low_stock_count: lowStock.rows[0].val || 0
    });
  });

  // --- VITE / SERVING FRONTEND ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => console.log(`Server on http://localhost:${PORT}`));
}

startServer();