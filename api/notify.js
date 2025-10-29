// /api/notify.js
import axios from 'axios';

export default async function handler(req, res) {
  const allowedOrigins = [
    'http://localhost:5173',
    'https://unionfloors.ru'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  console.log('Метод запроса:', req.method);
  console.log('Origin:', req.headers.origin);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешён. Используйте POST.' });
  }

  const { message, userId } = req.body;

  const BOT_TOKEN = process.env.BOT_TOKEN;
  const DEFAULT_CHAT_ID = process.env.TELEGRAM_USER_ID;

  const targetChatId = userId || DEFAULT_CHAT_ID;

  if (!BOT_TOKEN) {
    console.error('❌ BOT_TOKEN не задан в переменных окружения');
    return res.status(500).json({ error: 'Сервер не настроен: отсутствует BOT_TOKEN' });
  }

  if (!targetChatId) {
    return res.status(400).json({
      error:
        'Не указан userId. Передайте его в теле запроса или задайте TELEGRAM_USER_ID в Vercel Environment Variables.',
    });
  }

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      error: 'Тело запроса должно содержать поле "message" (текст уведомления).',
    });
  }

  try {
    const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: targetChatId,
      text: message,
      parse_mode: 'HTML',
    });

    console.log(`✅ Сообщение отправлено пользователю ${targetChatId}`);
    return res.status(200).json({
      success: true,
      message: 'Уведомление отправлено в Telegram.',
    });
  } catch (error) {
    console.error('❌ Ошибка отправки в Telegram:', error.response?.data || error.message);
    return res.status(500).json({
      error: 'Не удалось отправить сообщение в Telegram.',
      details: error.response?.data || error.message,
    });
  }
}