// /api/notify.js
import axios from 'axios';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешён. Используйте POST.' });
  }

  const { message, userId } = req.body;
  const BOT_TOKEN = process.env.BOT_TOKEN; // ← берётся из Vercel Env

  if (!BOT_TOKEN) {
    console.error('❌ BOT_TOKEN не задан в Vercel Environment Variables');
    return res.status(500).json({ error: 'Сервер не настроен: отсутствует BOT_TOKEN' });
  }

  if (!userId || !message) {
    return res.status(400).json({
      error: 'Не указан userId. Передайте его в теле запроса или задайте TELEGRAM_USER_ID в Vercel Environment Variables.',
    });
  }

  try {
    const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: userId,
      text: message,
      parse_mode: 'HTML',
    });

    console.log(`✅ Сообщение отправлено пользователю ${userId}`);
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