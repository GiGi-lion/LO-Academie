export default async function handler(req: any, res: any) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  const hasKey = apiKey.length > 0;

  const payload = {
    status: "ok",
    timestamp: new Date().toISOString(),
    geminiConfigured: hasKey,
    geminiKeyLength: hasKey ? apiKey.length : 0,
    environment: process.env.NODE_ENV || 'production'
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(200).json(payload);
  }
  
  res.statusCode = 200;
  res.end(JSON.stringify(payload));
}
