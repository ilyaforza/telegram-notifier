const axios = require('axios');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { userId, message } = req.body;
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'Bot token not configured' });
  }

  if (!userId || !message) {
    return res.status(400).json({ error: 'userId and message required' });
  }

  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: userId,
      text: message,
      parse_mode: 'HTML'
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Telegram error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Send failed' });
  }
};
