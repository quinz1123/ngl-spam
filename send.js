export default async function handler(req, res) {
  const { link, pesan } = req.query;

  if (!link || !pesan) {
    return res.status(400).json({ 
      status: false, 
      message: "Parameter kurang: link dan pesan diperlukan" 
    });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Gunakan API Deline
    const apiUrl = `https://api.deline.web.id/tools/spamngl?url=${encodeURIComponent(link)}&message=${encodeURIComponent(pesan)}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json"
      }
    });

    const data = await response.json();
    
    return res.status(200).json({
      status: true,
      source: "deline",
      result: data
    });

  } catch (error) {
    console.error('Error:', error);
    
    return res.status(500).json({ 
      status: false, 
      error: error.message
    });
  }
}