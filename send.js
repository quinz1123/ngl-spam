module.exports = async function handler(req, res) {
  const { link, pesan } = req.query;

  if (!link || !pesan) {
    return res.status(400).json({ 
      status: false, 
      message: "Parameter kurang: link dan pesan diperlukan" 
    });
  }

  // CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  // Handle OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ 
      status: false, 
      message: "Method tidak diizinkan" 
    });
  }

  try {
    console.log('Mengirim ke API Deline:', { link, pesan });
    
    // Gunakan API Deline
    const apiUrl = `https://api.deline.web.id/tools/spamngl?url=${encodeURIComponent(link)}&message=${encodeURIComponent(pesan)}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
      }
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      return res.status(200).json({
        status: true,
        source: "deline",
        result: data
      });
    } else {
      throw new Error(`API Error: ${response.status}`);
    }

  } catch (error) {
    console.error('Error:', error);
    
    // Fallback ke API lain
    try {
      const fallbackApi = `https://api-faa.my.id/faa/ngl-spam?link=${encodeURIComponent(link)}&pesan=${encodeURIComponent(pesan)}&jumlah=1`;
      
      const fallbackResponse = await fetch(fallbackApi);
      const fallbackData = await fallbackResponse.json();

      return res.status(200).json({
        status: fallbackData.status || false,
        source: "fallback",
        result: fallbackData
      });
    } catch (fallbackError) {
      return res.status(500).json({ 
        status: false, 
        error: error.message,
        fallbackError: fallbackError.message
      });
    }
  }
}