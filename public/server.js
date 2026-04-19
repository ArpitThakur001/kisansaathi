/**
 * KisanSaathi backend server
 * Node.js + Express + MySQL
 */

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'kisansaathi';

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

async function initDB() {
  const raw = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD
  });

  await raw.execute(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  await raw.end();

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS farmers (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      farm_name     VARCHAR(100) NOT NULL,
      village       VARCHAR(100) NOT NULL,
      district      VARCHAR(100),
      state         VARCHAR(100) NOT NULL,
      area          DECIMAL(8,2) NOT NULL,
      soil_type     VARCHAR(100),
      crop_name     VARCHAR(100) NOT NULL,
      crop_variety  VARCHAR(100),
      sowing_date   DATE,
      harvest_date  DATE,
      irrigation    VARCHAR(100),
      fertilizer    VARCHAR(200),
      notes         TEXT,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      full_name     VARCHAR(100) NOT NULL,
      email         VARCHAR(100) NOT NULL UNIQUE,
      password      VARCHAR(255) NOT NULL,
      phone         VARCHAR(15),
      role          ENUM('farmer','admin') DEFAULT 'farmer',
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS expenses (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      farmer_id     INT NOT NULL,
      category      VARCHAR(100) NOT NULL,
      description   VARCHAR(255),
      amount        DECIMAL(10,2) NOT NULL,
      expense_date  DATE NOT NULL,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS crop_history (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      farmer_id     INT NOT NULL,
      crop_name     VARCHAR(100) NOT NULL,
      variety       VARCHAR(100),
      season        VARCHAR(50),
      sowing_date   DATE,
      harvest_date  DATE,
      yield_kg      DECIMAL(10,2),
      notes         TEXT,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
    )
  `);

  console.log('Database and all 4 tables ready.');
}

app.get('/api/farmers', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM farmers ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/farmers/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM farmers WHERE id = ?', [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/farmers', async (req, res) => {
  const {
    farm_name, village, district, state, area, soil_type,
    crop_name, crop_variety, sowing_date, harvest_date,
    irrigation, fertilizer, notes
  } = req.body;

  if (!farm_name || !village || !state || !area || !crop_name) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO farmers
       (farm_name, village, district, state, area, soil_type, crop_name,
        crop_variety, sowing_date, harvest_date, irrigation, fertilizer, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        farm_name,
        village,
        district || null,
        state,
        area,
        soil_type || null,
        crop_name,
        crop_variety || null,
        sowing_date || null,
        harvest_date || null,
        irrigation || null,
        fertilizer || null,
        notes || null
      ]
    );

    const [rows] = await pool.execute('SELECT * FROM farmers WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/farmers/:id', async (req, res) => {
  const {
    farm_name, village, district, state, area, soil_type,
    crop_name, crop_variety, sowing_date, harvest_date,
    irrigation, fertilizer, notes
  } = req.body;

  try {
    await pool.execute(
      `UPDATE farmers SET
       farm_name=?, village=?, district=?, state=?, area=?, soil_type=?,
       crop_name=?, crop_variety=?, sowing_date=?, harvest_date=?,
       irrigation=?, fertilizer=?, notes=?
       WHERE id=?`,
      [
        farm_name,
        village,
        district || null,
        state,
        area,
        soil_type || null,
        crop_name,
        crop_variety || null,
        sowing_date || null,
        harvest_date || null,
        irrigation || null,
        fertilizer || null,
        notes || null,
        req.params.id
      ]
    );

    const [rows] = await pool.execute('SELECT * FROM farmers WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/farmers/:id', async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM farmers WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    res.json({ success: true, message: 'Farm deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, full_name, email, phone, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/users/register', async (req, res) => {
  const { full_name, email, password, phone, role } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Name, email and password required' });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO users (full_name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
      [full_name, email, password, phone || null, role || 'farmer']
    );
    res.status(201).json({ success: true, message: 'User registered', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, error: 'Email already exists' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, full_name, email, phone, role FROM users WHERE email=? AND password=?',
      [email, password]
    );
    if (!rows.length) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
    res.json({ success: true, message: 'Login successful', user: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/expenses/:farmer_id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM expenses WHERE farmer_id=? ORDER BY expense_date DESC',
      [req.params.farmer_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  const { farmer_id, category, description, amount, expense_date } = req.body;

  if (!farmer_id || !category || !amount || !expense_date) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO expenses (farmer_id, category, description, amount, expense_date) VALUES (?, ?, ?, ?, ?)',
      [farmer_id, category, description || null, amount, expense_date]
    );
    res.status(201).json({ success: true, message: 'Expense added', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/crop-history/:farmer_id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM crop_history WHERE farmer_id=? ORDER BY sowing_date DESC',
      [req.params.farmer_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/crop-history', async (req, res) => {
  const { farmer_id, crop_name, variety, season, sowing_date, harvest_date, yield_kg, notes } = req.body;

  if (!farmer_id || !crop_name) {
    return res.status(400).json({ success: false, error: 'farmer_id and crop_name required' });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO crop_history
       (farmer_id, crop_name, variety, season, sowing_date, harvest_date, yield_kg, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        farmer_id,
        crop_name,
        variety || null,
        season || null,
        sowing_date || null,
        harvest_date || null,
        yield_kg || null,
        notes || null
      ]
    );
    res.status(201).json({ success: true, message: 'Crop history added', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/crop-history/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM crop_history WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/chat', async (req, res) => {
  const { farmId, messages } = req.body;

  try {
    const [rows] = await pool.execute('SELECT * FROM farmers WHERE id = ?', [farmId]);
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Farm not found' });
    }

    const farm = rows[0];
    const systemPrompt = `You are KisanBot, a friendly Indian agricultural advisor.
Farm: ${farm.farm_name}, ${farm.village}, ${farm.state}
Area: ${farm.area} acres | Crop: ${farm.crop_name}
Irrigation: ${farm.irrigation || 'N/A'} | Fertilizer: ${farm.fertilizer || 'N/A'}
Give practical, concise advice. Use simple language.`;

    const GROQ_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_KEY) {
      return res.status(500).json({
        success: false,
        error: 'GROQ_API_KEY is not configured on the server.'
      });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        max_tokens: 800
      })
    });

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;
    res.json({ success: true, reply: reply || 'No response from AI.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`KisanSaathi running at http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('DB init failed:', err.message);
  process.exit(1);
});
