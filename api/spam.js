export default async function handler(req, res) {
  // Hanya terima POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, data, headers } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
        ...(headers || {})
      },
      body: JSON.stringify(data || {})
    });

    const result = await response.json().catch(() => ({}));
    const status = response.status;

    // Kirim balik hasil ke frontend
    res.status(200).json({
      success: [200, 201, 202, 204].includes(status) || 
               result.success === true || 
               result.status === 'success' ||
               result.message === 'OTP terkirim',
      status: status,
      data: result
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}