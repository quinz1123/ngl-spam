
export default async function handler(req, res) {
  const { link, pesan } = req.query;

  if (!link || !pesan) {
    return res.status(400).json({ status: false, message: "Parameter kurang" });
  }

  try {
    // Coba API Deline terlebih dahulu
    const delineApi = `https://api.deline.web.id/tools/spamngl?url=${encodeURIComponent(link)}&message=${encodeURIComponent(pesan)}`;
    
    const response = await fetch(delineApi, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Origin": "https://deline.web.id"
      }
    });

    if (response.ok) {
      const data = await response.json();
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.status(200).json({
        status: true,
        source: "deline",
        data: data
      });
    }

    // Fallback ke API lain jika Deline gagal
    const fallbackApi = `https://api-faa.my.id/faa/ngl-spam?link=${encodeURIComponent(link)}&pesan=${encodeURIComponent(pesan)}&jumlah=1`;
    
    const fallbackResponse = await fetch(fallbackApi);
    const fallbackData = await fallbackResponse.json();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json({
      status: fallbackData.status || false,
      source: "fallback",
      data: fallbackData
    });

  } catch (error) {
    console.error('Error:', error);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(500).json({ 
      status: false, 
      error: error.message,
      source: "error"
    });
  }
}