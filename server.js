const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json()); // Для обработки JSON-запросов

const supabase = createClient(
    'https://zkhnijcxqhuljvufgrqa.supabase.co', // Замени на свой URL Supabase
    'your-anon-key' // Замени на свой анонимный ключ
);

// Генерация 16-значного кода
function generateCode() {
    return Math.random().toString().slice(2, 18);
}

// Маршрут для генерации карты
app.get('/generate-card', async (req, res) => {
    const code = generateCode();

    // Создаем карту с начальным балансом 0 GOM
    const { data, error } = await supabase
        .from('cards')
        .insert([{ code, balance: 0 }]);

    if (error) {
        return res.status(500).json({ error: 'Ошибка при создании карты' });
    }

    res.json({ code });
});

// Маршрут для перевода средств
app.post('/transfer', async (req, res) => {
    const { fromCode, toCode, amount } = req.body;

    // Проверяем, достаточно ли средств на карте отправителя
    const { data: fromCard, error: fromError } = await supabase
        .from('cards')
        .select('balance')
        .eq('code', fromCode)
        .single();

    if (fromError || !fromCard) {
        return res.status(400).json({ error: 'Карта отправителя не найдена' });
    }

    if (fromCard.balance < amount) {
        return res.status(400).json({ error: 'Недостаточно средств' });
    }

    // Проверяем, существует ли карта получателя
    const { data: toCard, error: toError } = await supabase
        .from('cards')
        .select('balance')
        .eq('code', toCode)
        .single();

    if (toError || !toCard) {
        return res.status(400).json({ error: 'Карта получателя не найдена' });
    }

    // Выполняем перевод
    const { error: updateFromError } = await supabase
        .from('cards')
        .update({ balance: fromCard.balance - amount })
        .eq('code', fromCode);

    const { error: updateToError } = await supabase
        .from('cards')
        .update({ balance: toCard.balance + amount })
        .eq('code', toCode);

    if (updateFromError || updateToError) {
        return res.status(500).json({ error: 'Ошибка при переводе средств' });
    }

    res.json({ success: true });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});