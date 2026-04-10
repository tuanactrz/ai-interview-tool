const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

async function query(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SECRET_KEY,
      'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`,
      'Prefer': method === 'POST' ? 'return=representation' : ''
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, opts);
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  try {
    if (action === 'getCompanies') {
      const data = await query('companies?order=created_at.desc');
      return res.json(data);
    }
    if (action === 'createCompany') {
      const data = await query('companies', 'POST', { name: req.body.name });
      return res.json(data[0]);
    }
    if (action === 'deleteCompany') {
      await query(`companies?id=eq.${req.body.id}`, 'DELETE');
      return res.json({ ok: true });
    }
    if (action === 'getRoles') {
      const data = await query(`roles?company_id=eq.${req.query.company_id}&order=created_at.desc`);
      return res.json(data);
    }
    if (action === 'getRole') {
      const data = await query(`roles?id=eq.${req.query.id}`);
      return res.json(data[0]);
    }
    if (action === 'createRole') {
      const data = await query('roles', 'POST', req.body);
      return res.json(data[0]);
    }
    if (action === 'deleteRole') {
      await query(`roles?id=eq.${req.body.id}`, 'DELETE');
      return res.json({ ok: true });
    }
    if (action === 'getCandidates') {
      const data = await query(`candidates?role_id=eq.${req.query.role_id}&order=created_at.desc`);
      return res.json(data);
    }
    if (action === 'getCandidate') {
      const data = await query(`candidates?interview_token=eq.${req.query.token}`);
      return res.json(data[0]);
    }
    if (action === 'createCandidate') {
      const data = await query('candidates', 'POST', req.body);
      return res.json(data[0]);
    }
    if (action === 'updateCandidateStatus') {
      const data = await query(`candidates?id=eq.${req.body.id}`, 'PATCH', { status: req.body.status });
      return res.json(data);
    }
    if (action === 'saveResult') {
      const data = await query('interview_results', 'POST', req.body);
      return res.json(data[0]);
    }
    if (action === 'getResult') {
      const data = await query(`interview_results?candidate_id=eq.${req.query.candidate_id}`);
      return res.json(data[0]);
    }
    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
