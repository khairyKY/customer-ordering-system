const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, '../database/catalog_seed.json');

if (fs.existsSync(seedPath)) {
    const rawData = fs.readFileSync(seedPath);
    const products = JSON.parse(rawData);
    console.log("--- SEED READY ---");
    console.log(`Detected ${products.length} products in catalog_seed.json`);
    console.log("The productController will load this data on the next restart.");
} else {
    console.error("Error: catalog_seed.json not found in src/database/");
}
