/**
 * Vercel Serverless Function Proxy for Gemini API
 * Forwards requests to Gemini API securely using server-side GEMINI_API_KEY.
 */

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Gemini API Key is not configured on the Vercel server. Please add GEMINI_API_KEY to your environment variables in Vercel.',
      code: 'MISSING_API_KEY'
    });
  }

  try {
    // We default to gemini-1.5-flash which is stable and ideal for this task.
    // Allow custom model parameter in request query if desired, default to gemini-1.5-flash.
    const model = req.query.model || 'gemini-1.5-flash';
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'Error calling Google Gemini API',
        details: data
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    return res.status(500).json({
      error: 'Internal Server Error in API Proxy',
      message: error.message
    });
  }
};
