export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-candidate-id, x-question-index');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const candidateId = req.headers['x-candidate-id'];
  const questionIndex = req.headers['x-question-index'];
  const path = `${candidateId}/q${questionIndex}.webm`;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);

  const uploadRes = await fetch(
    `${process.env.SUPABASE_URL}/storage/v1/object/interview-videos/${path}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
        'Content-Type': 'video/webm',
        'x-upsert': 'true'
      },
      body: buffer
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    return res.status(500).json({ error: err });
  }

  return res.json({ path });
}
