const { v4: uuidv4 } = require('uuid');
const productController = require('./productController');

// Mock Database (In-memory for Sprint 2)
let cart = {
    id: "dev-session-cart",
    sessionId: "dev-session",
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0
};

const TAX_RATE = 0.10; // Sprint 2 updated to 10% per instructions

const calculateTotals = () => {
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.total_price, 0);
    cart.tax = cart.subtotal * TAX_RATE;
    cart.total = cart.subtotal + cart.tax;
};

exports.getCart = (req, res) => {
    res.json(cart);
};

exports.addItem = (req, res) => {
    const { product_id, quantity } = req.body;
    const product = productController.getProductById(product_id);
    
    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }

    const requestedQuantity = quantity || 1;
    const existingItem = cart.items.find(item => item.product_id === product_id);
    const currentQuantityInCart = existingItem ? existingItem.quantity : 0;

    if (currentQuantityInCart + requestedQuantity > product.stock) {
        return res.status(400).json({ error: "Insufficient stock" });
    }

    if (existingItem) {
        existingItem.quantity += requestedQuantity;
        existingItem.total_price = existingItem.quantity * product.price;
    } else {
        const newItem = {
            id: uuidv4(),
            product_id: product.id,
            product_name: product.name,
            unit_price: product.price,
            quantity: requestedQuantity,
            total_price: product.price * requestedQuantity
        };
        cart.items.push(newItem);
    }

    calculateTotals();
    res.status(201).json(cart);
};

exports.updateItem = (req, res) => {
    const { product_id, new_quantity } = req.body;
    const product = productController.getProductById(product_id);
    const existingItem = cart.items.find(item => item.product_id === product_id);

    if (!existingItem) {
        return res.status(404).json({ error: "Item not in cart" });
    }

    if (new_quantity > product.stock) {
        return res.status(400).json({ error: "Insufficient stock" });
    }

    if (new_quantity <= 0) {
        cart.items = cart.items.filter(item => item.product_id !== product_id);
    } else {
        existingItem.quantity = new_quantity;
        existingItem.total_price = existingItem.quantity * existingItem.unit_price;
    }

    calculateTotals();
    res.json({ success: true, cart });
};

exports.removeItem = (req, res) => {
    const { product_id } = req.body;
    cart.items = cart.items.filter(item => item.product_id !== product_id);
    calculateTotals();
    res.json({ success: true, cart });
};
