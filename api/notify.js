// /api/notify.js
import axios from 'axios';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Только POST' });
  }

  const { message, userId } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: 'Требуются userId и message' });
  }

  const BOT_TOKEN = process.env.BOT_TOKEN;
  if (!BOT_TOKEN) {
    console.error('❌ BOT_TOKEN не задан в Vercel Environment Variables');
    return res.status(500).json({ error: 'Сервер не настроен' });
  }

  try {
    const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: userId,
      text: message,
      parse_mode: 'HTML'
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Telegram error:', err.response?.data || err.message);
    return res.status(500).json({
      error: 'Ошибка отправки',
      details: err.response?.data || err.message
    });
  }
}