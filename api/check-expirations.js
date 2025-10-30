// pages/api/check-expirations.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import axios from 'axios';

// 🔥 Firebase config — тот же, что и в app.jsx
const firebaseConfig = {
  apiKey: "AIzaSyDprHzxIZ79Fd2nA-9QLor2j4kXwXaoFNQ",
  authDomain: "union-protection-1876d.firebaseapp.com",
  projectId: "union-protection-1876d",
  storageBucket: "union-protection-1876d.firebasestorage.app",
  messagingSenderId: "929279771683",
  appId: "1:929279771683:web:508c8666ec94f799769d96"
};

// Инициализация Firebase (только один раз)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  // Разрешаем только GET или POST (cron-сервисы обычно используют GET)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешён' });
  }

  try {
    const now = new Date();
    // Запрос: все записи, где expiresAt <= now и telegramSent != true
    const q = query(
      collection(db, 'protections'),
      where('expiresAt', '<=', now.toISOString()),
      where('telegramSent', '!=', true) // или where('telegramSent', '==', false), если поле всегда есть
    );

    const snapshot = await getDocs(q);
    const results = [];

    if (snapshot.empty) {
      return res.status(200).json({ message: 'Нет просроченных записей', processed: 0 });
    }

    // Загружаем региональных менеджеров один раз
    const managersSnapshot = await getDocs(collection(db, 'regionalManagers'));
    const managersMap = {};
    managersSnapshot.forEach(doc => {
      const data = doc.data();
      managersMap[data.name] = data.telegramUserId;
    });

    for (const docSnap of snapshot.docs) {
      const entry = { id: docSnap.id, ...docSnap.data() };

      // Помечаем как отправленную СРАЗУ — чтобы избежать повторной обработки
      await updateDoc(doc(db, 'protections', entry.id), { telegramSent: true });

      const telegramId = managersMap[entry.regionalManager];
      if (!telegramId) {
        results.push({ id: entry.id, status: 'no_telegram_id' });
        continue;
      }

      // Формируем сообщение (то же, что и в app.jsx)
      const message = `⚠️⚠️ Защита проекта завершена! ⚠️⚠️

🏢 Партнер: ${entry.organization || '—'}
👤 Менеджер: ${entry.manager || '—'}
🔖 Артикул: ${entry.article || '—'}
📐 Метраж: ${entry.area || '—'}
🧑‍💼 Клиент: ${entry.clientName || '—'}
📞 Телефон: ${entry.clientPhone || '—'}

👨‍💼 Рег. менеджер: ${entry.regionalManager || '—'}
📅 Дата и время завершения: ${new Date(entry.expiresAt).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`;

      try {
        await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
          chat_id: telegramId,
          text: message,
          parse_mode: 'HTML'
        });
        results.push({ id: entry.id, status: 'sent', to: telegramId });
      } catch (err) {
        console.error('Ошибка Telegram:', err.message);
        results.push({ id: entry.id, status: 'error', error: err.message });
      }
    }

    return res.status(200).json({
      message: 'Обработка завершена',
      processed: results.length,
      details: results
    });

  } catch (error) {
    console.error('Критическая ошибка:', error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера', details: error.message });
  }
}