const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

// Настройка CORS
app.use(cors({
    origin: 'https://ilyshka3346.github.io/card/', // Замените на ваш URL GitHub Pages
    methods: ['GET', 'POST'], // Разрешить только GET и POST
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Настройка Supabase
const supabaseUrl = 'https://zkhnijcxqhuljvufgrqa.supabase.co'; // Замените на ваш URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpraG5pamN4cWh1bGp2dWZncnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxMzk0ODYsImV4cCI6MjA1NTcxNTQ4Nn0.CcT8Ok51EpfyWJngtlQgkQQvtmZnN7uLyRW1NGegS6w'; // Замените на ваш ключ
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(bodyParser.json());

// Генерация номера карты
const generateCardCode = () => {
    let code = '';
    for (let i = 0; i < 16; i++) {
        code += Math.floor(Math.random() * 10);
    }
    return code.match(/.{1,4}/g).join(' ');
};

// Создание новой карты
app.post('/api/cards/create', async (req, res) => {
    try {
        const cardCode = generateCardCode();
        const newCard = {
            code: cardCode,
            balance: 0,
            history: []
        };

        const { data, error } = await supabase
            .from('cards')
            .insert([newCard]);

        if (error) throw error;

        res.json(newCard);
    } catch (error) {
        console.error('Ошибка при создании карты:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Пополнение баланса карты
app.post('/api/cards/deposit', async (req, res) => {
    try {
        const { cardCode, amount } = req.body;

        // Получаем текущую карту
        const { data: card, error: fetchError } = await supabase
            .from('cards')
            .select('*')
            .eq('code', cardCode)
            .single();

        if (fetchError || !card) {
            return res.status(404).json({ error: 'Карта не найдена' });
        }

        // Обновляем баланс и историю
        card.balance += amount;
        card.history.push({
            date: new Date().toLocaleString(),
            type: 'Пополнение',
            amount: amount
        });

        // Сохраняем изменения
        const { error: updateError } = await supabase
            .from('cards')
            .update(card)
            .eq('code', cardCode);

        if (updateError) throw updateError;

        res.json(card);
    } catch (error) {
        console.error('Ошибка при пополнении баланса:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Перевод между картами
app.post('/api/cards/transfer', async (req, res) => {
    try {
        const { fromCard, toCard, amount } = req.body;

        // Получаем исходную карту
        const { data: sourceCard, error: fetchSourceError } = await supabase
            .from('cards')
            .select('*')
            .eq('code', fromCard)
            .single();

        if (fetchSourceError || !sourceCard) {
            return res.status(404).json({ error: 'Исходная карта не найдена' });
        }

        // Получаем целевую карту
        const { data: targetCard, error: fetchTargetError } = await supabase
            .from('cards')
            .select('*')
            .eq('code', toCard)
            .single();

        if (fetchTargetError || !targetCard) {
            return res.status(404).json({ error: 'Целевая карта не найдена' });
        }

        // Проверяем баланс
        if (sourceCard.balance < amount) {
            return res.status(400).json({ error: 'Недостаточно средств' });
        }

        // Обновляем баланс и историю
        sourceCard.balance -= amount;
        targetCard.balance += amount;

        sourceCard.history.push({
            date: new Date().toLocaleString(),
            type: `Перевод на карту ${toCard}`,
            amount: -amount
        });

        targetCard.history.push({
            date: new Date().toLocaleString(),
            type: `Перевод от карты ${fromCard}`,
            amount: amount
        });

        // Сохраняем изменения
        const { error: updateSourceError } = await supabase
            .from('cards')
            .update(sourceCard)
            .eq('code', fromCard);

        const { error: updateTargetError } = await supabase
            .from('cards')
            .update(targetCard)
            .eq('code', toCard);

        if (updateSourceError || updateTargetError) {
            throw updateSourceError || updateTargetError;
        }

        res.json({ sourceCard, targetCard });
    } catch (error) {
        console.error('Ошибка при переводе:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение данных карты
app.get('/api/cards/:cardCode', async (req, res) => {
    try {
        const cardCode = req.params.cardCode;

        const { data: card, error } = await supabase
            .from('cards')
            .select('*')
            .eq('code', cardCode)
            .single();

        if (error || !card) {
            return res.status(404).json({ error: 'Карта не найдена' });
        }

        res.json(card);
    } catch (error) {
        console.error('Ошибка при получении данных карты:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});

// Экспорт для Vercel
module.exports = app;