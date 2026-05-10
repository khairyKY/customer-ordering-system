const { v4: uuidv4 } = require('uuid');

// Mock Database (In-memory for Sprint 1)
let cart = {
    id: "dev-session-cart",
    sessionId: "dev-session",
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0
};

const TAX_RATE = 0.08; // 8%

const calculateTotals = () => {
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.total_price, 0);
    cart.tax = cart.subtotal * TAX_RATE;
    cart.total = cart.subtotal + cart.tax;
};

exports.getCart = (req, res) => {
    res.json(cart);
};

exports.addItem = (req, res) => {
    const { product_id, product_name, unit_price, quantity } = req.body;
    
    if (!product_id || !product_name || !unit_price) {
        return res.status(400).json({ error: "Missing product details" });
    }

    const newItem = {
        id: uuidv4(),
        product_id,
        product_name,
        unit_price,
        quantity: quantity || 1,
        total_price: unit_price * (quantity || 1)
    };

    cart.items.push(newItem);
    calculateTotals();
    res.status(201).json(cart);
};
