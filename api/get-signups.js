const { neon } = require('@neondatabase/serverless');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = req.headers['authorization'] || '';
  const token = auth.replace('Bearer ', '');
  if (token !== process.env.BACKOFFICE_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`SELECT * FROM signups ORDER BY created_at DESC`;
    res.status(200).json({ signups: rows });
  } catch (err) {
    console.error('get-signups error:', err);
    res.status(500).json({ error: err.message });
  }
};
