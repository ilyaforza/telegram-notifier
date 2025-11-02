// /api/notify.js
import axios from 'axios';

export default async function handler(req, res) {
  // CORS
  const allowedOrigins = [
    'http://localhost:5173',
    'https://unionfloors.ru'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Только POST разрешён' });
  }

  const { message, userId } = req.body;

  const BOT_TOKEN = process.env.BOT_TOKEN;
  const DEFAULT_CHAT_ID = process.env.TELEGRAM_USER_ID;
  const targetChatId = userId || DEFAULT_CHAT_ID;

  if (!BOT_TOKEN) {
    console.error('❌ BOT_TOKEN не задан');
    return res.status(500).json({ error: 'Отсутствует BOT_TOKEN' });
  }
  if (!targetChatId) {
    return res.status(400).json({ error: 'Не указан userId или TELEGRAM_USER_ID' });
  }
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Требуется поле "message"' });
  }

  try {
    // 🔥 ИСПРАВЛЕНО: убраны пробелы!
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: targetChatId,
      text: message,
      parse_mode: 'HTML'
    });

    console.log(`✅ Отправлено: ${targetChatId}`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Telegram ошибка:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Ошибка отправки', details: error.message });
  }
}