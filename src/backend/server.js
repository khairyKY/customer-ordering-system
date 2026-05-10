const express = require('express');
const cors = require('cors');
const cartRoutes = require('./routes/cartRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Register Routes
app.use('/api/cart', cartRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', sprint: 1 });
});

app.listen(PORT, () => {
    console.log(`Sprint 1 Backend running on http://localhost:${PORT}`);
});
