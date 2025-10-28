// api/notify.js
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; // будем задавать в настройках Vercel
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

app.post('/api/notify', async (req, res) => {
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: 'userId and message are required' });
  }

  try {
    await axios.post(TELEGRAM_API, {
      chat_id: userId,
      text: message,
      parse_mode: 'HTML'
    });
    console.log('✅ Sent to Telegram:', userId);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('❌ Telegram error:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to send' });
  }
});

module.exports = app;