const { neon } = require('@neondatabase/serverless');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sql = neon(process.env.DATABASE_URL);

    await sql`
      CREATE TABLE IF NOT EXISTS signups (
        id SERIAL PRIMARY KEY,
        session_id TEXT UNIQUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        first_name TEXT,
        email TEXT,
        phone TEXT,
        country_code TEXT,
        birthdate TEXT,
        gender TEXT,
        meet_gender TEXT,
        age_min INTEGER,
        age_max INTEGER,
        education TEXT,
        children TEXT,
        ethnicity TEXT,
        religion TEXT,
        social_media JSONB,
        location TEXT,
        stripe_payment_intent TEXT,
        payment_status TEXT DEFAULT 'incomplete',
        last_step INTEGER DEFAULT 0
      )
    `;

    await sql`ALTER TABLE signups ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT`;

    const body = req.body;
    const sessionId = body.sessionId;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

    const k = {
      first_name: body.firstName ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      country_code: body.countryCode ?? null,
      birthdate: body.birthdate ?? null,
      gender: body.gender ?? null,
      meet_gender: body.meetGender ?? null,
      age_min: body.ageMin ?? null,
      age_max: body.ageMax ?? null,
      education: body.education ?? null,
      children: body.children ?? null,
      ethnicity: body.ethnicity ?? null,
      religion: body.religion ?? null,
      social_media: body.socialMedia ? JSON.stringify(body.socialMedia) : null,
      location: body.location ?? null,
      stripe_payment_intent: body.paymentIntentId ?? null,
      payment_status: body.paymentStatus ?? 'incomplete',
      last_step: body.lastStep ?? 0,
    };

    await sql`
      INSERT INTO signups (session_id, updated_at, first_name, email, phone, country_code, birthdate, gender, meet_gender, age_min, age_max, education, children, ethnicity, religion, social_media, location, stripe_payment_intent, payment_status, last_step)
      VALUES (${sessionId}, NOW(), ${k.first_name}, ${k.email}, ${k.phone}, ${k.country_code}, ${k.birthdate}, ${k.gender}, ${k.meet_gender}, ${k.age_min}, ${k.age_max}, ${k.education}, ${k.children}, ${k.ethnicity}, ${k.religion}, ${k.social_media}, ${k.location}, ${k.stripe_payment_intent}, ${k.payment_status}, ${k.last_step})
      ON CONFLICT (session_id) DO UPDATE SET
        updated_at = NOW(),
        first_name = COALESCE(EXCLUDED.first_name, signups.first_name),
        email = COALESCE(EXCLUDED.email, signups.email),
        phone = COALESCE(EXCLUDED.phone, signups.phone),
        country_code = COALESCE(EXCLUDED.country_code, signups.country_code),
        birthdate = COALESCE(EXCLUDED.birthdate, signups.birthdate),
        gender = COALESCE(EXCLUDED.gender, signups.gender),
        meet_gender = COALESCE(EXCLUDED.meet_gender, signups.meet_gender),
        age_min = COALESCE(EXCLUDED.age_min, signups.age_min),
        age_max = COALESCE(EXCLUDED.age_max, signups.age_max),
        education = COALESCE(EXCLUDED.education, signups.education),
        children = COALESCE(EXCLUDED.children, signups.children),
        ethnicity = COALESCE(EXCLUDED.ethnicity, signups.ethnicity),
        religion = COALESCE(EXCLUDED.religion, signups.religion),
        social_media = COALESCE(EXCLUDED.social_media, signups.social_media),
        location = COALESCE(EXCLUDED.location, signups.location),
        stripe_payment_intent = COALESCE(EXCLUDED.stripe_payment_intent, signups.stripe_payment_intent),
        payment_status = COALESCE(EXCLUDED.payment_status, signups.payment_status),
        last_step = GREATEST(EXCLUDED.last_step, signups.last_step)
    `;

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('submit-form error:', err);
    res.status(500).json({ error: err.message });
  }
};
