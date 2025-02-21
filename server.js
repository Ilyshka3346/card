const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors()); // Разрешает запросы с любого источника

const PORT = process.env.PORT || 3000;

let cards = {}; // Имитация базы данных

// Создание новой карты
app.post("/api/cards/create", (req, res) => {
    const cardCode = Math.random().toString().slice(2, 12);
    const newCard = { code: cardCode, balance: 0, history: [] };
    cards[cardCode] = newCard;
    res.json(newCard);
});

// Получение информации о карте
app.get("/api/cards/:cardCode", (req, res) => {
    const card = cards[req.params.cardCode];
    if (card) {
        res.json(card);
    } else {
        res.status(404).json({ error: "Карта не найдена" });
    }
});

// Пополнение баланса
app.post("/api/cards/deposit", (req, res) => {
    const { cardCode, amount } = req.body;
    if (cards[cardCode]) {
        cards[cardCode].balance += amount;
        cards[cardCode].history.push({ type: "Пополнение", amount, date: new Date().toISOString() });
        res.json(cards[cardCode]);
    } else {
        res.status(404).json({ error: "Карта не найдена" });
    }
});

// Перевод средств
app.post("/api/cards/transfer", (req, res) => {
    const { fromCard, toCard, amount } = req.body;
    if (cards[fromCard] && cards[toCard]) {
        if (cards[fromCard].balance >= amount) {
            cards[fromCard].balance -= amount;
            cards[toCard].balance += amount;

            const transaction = { type: "Перевод", amount, date: new Date().toISOString() };
            cards[fromCard].history.push({ ...transaction, to: toCard });
            cards[toCard].history.push({ ...transaction, from: fromCard });

            res.json({ sourceCard: cards[fromCard], targetCard: cards[toCard] });
        } else {
            res.status(400).json({ error: "Недостаточно средств" });
        }
    } else {
        res.status(404).json({ error: "Одна из карт не найдена" });
    }
});

// Запуск сервера
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
