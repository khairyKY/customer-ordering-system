// Mock Database (In-memory for Sprint 2)
const products = [
    { id: "p1", name: "Wireless Mouse", price: 25.99, stock: 10, image_url: "https://placehold.co/100x100?text=Mouse" },
    { id: "p2", name: "Mechanical Keyboard", price: 89.99, stock: 5, image_url: "https://placehold.co/100x100?text=Keyboard" },
    { id: "p3", name: "Gaming Monitor", price: 299.99, stock: 3, image_url: "https://placehold.co/100x100?text=Monitor" },
    { id: "p4", name: "USB-C Hub", price: 45.00, stock: 20, image_url: "https://placehold.co/100x100?text=Hub" },
    { id: "p5", name: "Webcam 1080p", price: 65.50, stock: 8, image_url: "https://placehold.co/100x100?text=Webcam" },
    { id: "p6", name: "Laptop Stand", price: 35.00, stock: 15, image_url: "https://placehold.co/100x100?text=Stand" }
];

exports.getProducts = (req, res) => {
    res.json(products);
};

exports.getProductById = (id) => {
    return products.find(p => p.id === id);
};
