export default async function handler(req, res) {
  const { link, pesan } = req.query;

  if (!link || !pesan) {
    return res.status(400).json({ status: false, message: "parameter kurang" });
  }

  try {
    const api = `https://api-faa.my.id/faa/ngl-spam?link=${encodeURIComponent(link)}&pesan=${encodeURIComponent(pesan)}&jumlah=1`;

    const r = await fetch(api, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      }
    });

    const data = await r.text();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).send(data);

  } catch (e) {
    res.status(500).json({ status: false, error: e.message });
  }
}