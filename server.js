const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

// Настройка CORS
app.use(cors({
    origin: 'https://ilyshka3346.github.io/card/', // Разрешить запросы с GitHub Pages
    methods: ['GET', 'POST', 'OPTIONS'], // Разрешить GET, POST и OPTIONS
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // Разрешить передачу куки и заголовков авторизации
}));

// Обработка предварительных запросов (OPTIONS)
app.options('*', cors()); // Разрешить CORS для всех маршрутов

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

// Корневой маршрут /api/cards
app.get('/api/cards', (req, res) => {
    res.json({ message: 'Добро пожаловать в API банковских карт!' });
});

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

// Обработка 404
app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error('Ошибка сервера:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});

// Экспорт для Vercel
module.exports = app;