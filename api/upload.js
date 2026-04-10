export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-candidate-id, x-question-index');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const candidateId = req.headers['x-candidate-id'];
  const questionIndex = req.headers['x-question-index'];

  if (!candidateId || questionIndex === undefined) {
    return res.status(400).json({ error: 'Missing headers' });
  }

  const path = `${candidateId}/q${questionIndex}.webm`;

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    console.log(`Uploading video: ${path}, size: ${buffer.length} bytes`);

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

    const responseText = await uploadRes.text();
    console.log(`Upload response ${uploadRes.status}:`, responseText);

    if (!uploadRes.ok) {
      return res.status(500).json({ error: responseText });
    }

    return res.json({ path, size: buffer.length });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: err.message });
  }
}
