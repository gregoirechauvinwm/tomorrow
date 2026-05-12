const { neon } = require('@neondatabase/serverless');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = req.headers['authorization'] || '';
  const token = auth.replace('Bearer ', '');
  if (token !== process.env.BACKOFFICE_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const sql = neon(process.env.DATABASE_URL);
    const { sessionId } = req.body || {};
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
    await sql`ALTER TABLE signups ADD COLUMN IF NOT EXISTS payment_forced BOOLEAN DEFAULT false`;
    await sql`UPDATE signups SET payment_status = 'succeeded', payment_forced = true, last_step = GREATEST(last_step, 13), updated_at = NOW() WHERE session_id = ${sessionId}`;
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('mark-paid error:', err);
    res.status(500).json({ error: err.message });
  }
};
