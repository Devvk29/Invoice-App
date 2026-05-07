// Seed script to add Sikko Industries products to the database
const mysql = require("mysql2/promise");
require("dotenv").config();

const PRODUCTS = [
  // Organic Certified Agro Chemicals
  { name: "Sikko Organic Neem Oil", hsn_code: "3808", unit_price: 450, unit: "Per Litre", description: "Cold-pressed organic neem oil for pest control", category: "Organic Certified Agro Chemicals", stock: 500 },
  { name: "Sikko Bio Pesticide (Beauveria)", hsn_code: "3808", unit_price: 680, unit: "Per Litre", description: "Organic bio-pesticide for crop protection", category: "Organic Certified Agro Chemicals", stock: 300 },
  { name: "Sikko Organic Humic Acid", hsn_code: "3824", unit_price: 520, unit: "Per Kg", description: "Organic humic acid soil conditioner", category: "Organic Certified Agro Chemicals", stock: 400 },
  { name: "Sikko Trichoderma Viride", hsn_code: "3808", unit_price: 380, unit: "Per Kg", description: "Bio-fungicide for soil-borne disease control", category: "Organic Certified Agro Chemicals", stock: 350 },

  // Organic Agro Chemicals
  { name: "Sikko Organic Growth Promoter", hsn_code: "3808", unit_price: 750, unit: "Per Litre", description: "Plant growth promoter for all crops", category: "Organic Agro Chemicals", stock: 200 },
  { name: "Sikko Seaweed Extract", hsn_code: "1212", unit_price: 890, unit: "Per Litre", description: "Premium seaweed extract for plant nutrition", category: "Organic Agro Chemicals", stock: 250 },
  { name: "Sikko Amino Acid Liquid", hsn_code: "2922", unit_price: 620, unit: "Per Litre", description: "Amino acid based plant growth enhancer", category: "Organic Agro Chemicals", stock: 300 },
  { name: "Sikko Organic Fungicide", hsn_code: "3808", unit_price: 480, unit: "Per Litre", description: "Organic copper-based fungicide", category: "Organic Agro Chemicals", stock: 400 },

  // Agro Chemicals
  { name: "Sikko Chlorpyrifos 20% EC", hsn_code: "3808", unit_price: 420, unit: "Per Litre", description: "Broad-spectrum insecticide", category: "Agro Chemicals", stock: 600 },
  { name: "Sikko Imidacloprid 17.8% SL", hsn_code: "3808", unit_price: 1250, unit: "Per Litre", description: "Systemic insecticide for sucking pests", category: "Agro Chemicals", stock: 400 },
  { name: "Sikko Mancozeb 75% WP", hsn_code: "3808", unit_price: 560, unit: "Per Kg", description: "Contact fungicide for multiple crops", category: "Agro Chemicals", stock: 500 },
  { name: "Sikko Glyphosate 41% SL", hsn_code: "3808", unit_price: 480, unit: "Per Litre", description: "Non-selective systemic herbicide", category: "Agro Chemicals", stock: 350 },
  { name: "Sikko Lambda Cyhalothrin 5% EC", hsn_code: "3808", unit_price: 780, unit: "Per Litre", description: "Synthetic pyrethroid insecticide", category: "Agro Chemicals", stock: 300 },
  { name: "Sikko Acetamiprid 20% SP", hsn_code: "3808", unit_price: 1450, unit: "Per Kg", description: "Neonicotinoid insecticide", category: "Agro Chemicals", stock: 250 },

  // Fertilizers
  { name: "Sikko NPK 19:19:19", hsn_code: "3105", unit_price: 85, unit: "Per Kg", description: "Water soluble NPK fertilizer", category: "Fertilizers", stock: 1000 },
  { name: "Sikko DAP Granules", hsn_code: "3105", unit_price: 32, unit: "Per Kg", description: "Di-Ammonium Phosphate granular fertilizer", category: "Fertilizers", stock: 2000 },
  { name: "Sikko Urea 46%", hsn_code: "3102", unit_price: 18, unit: "Per Kg", description: "High nitrogen urea fertilizer", category: "Fertilizers", stock: 3000 },
  { name: "Sikko Potash (MOP)", hsn_code: "3104", unit_price: 28, unit: "Per Kg", description: "Muriate of Potash fertilizer", category: "Fertilizers", stock: 1500 },
  { name: "Sikko Micro Nutrient Mix", hsn_code: "3105", unit_price: 180, unit: "Per Kg", description: "Complete micro nutrient mixture", category: "Fertilizers", stock: 800 },
  { name: "Sikko Calcium Nitrate", hsn_code: "2834", unit_price: 65, unit: "Per Kg", description: "Calcium nitrate for horticulture", category: "Fertilizers", stock: 600 },
  { name: "Sikko Sulphur 90% WDG", hsn_code: "2503", unit_price: 120, unit: "Per Kg", description: "Sulphur wettable dispersible granules", category: "Fertilizers", stock: 700 },

  // Seeds
  { name: "Sikko Hybrid Tomato Seeds", hsn_code: "1209", unit_price: 1800, unit: "Per Kg", description: "High yield hybrid tomato seeds", category: "Seeds", stock: 100 },
  { name: "Sikko Hybrid Cotton Seeds", hsn_code: "1209", unit_price: 2500, unit: "Per Kg", description: "BT cotton hybrid seeds", category: "Seeds", stock: 150 },
  { name: "Sikko Groundnut Seeds", hsn_code: "1209", unit_price: 120, unit: "Per Kg", description: "Premium groundnut seeds for sowing", category: "Seeds", stock: 500 },
  { name: "Sikko Vegetable Seed Kit", hsn_code: "1209", unit_price: 350, unit: "Per Box", description: "Mixed vegetable seed collection", category: "Seeds", stock: 200 },

  // Sprayers
  { name: "Sikko Battery Sprayer 16L", hsn_code: "8424", unit_price: 3500, unit: "Per Unit", description: "Rechargeable battery operated sprayer 16 litre", category: "Sprayers", stock: 80 },
  { name: "Sikko Manual Sprayer 16L", hsn_code: "8424", unit_price: 1200, unit: "Per Unit", description: "Manual pump sprayer 16 litre", category: "Sprayers", stock: 120 },
  { name: "Sikko Power Sprayer", hsn_code: "8424", unit_price: 8500, unit: "Per Unit", description: "Petrol engine power sprayer", category: "Sprayers", stock: 40 },
  { name: "Sikko Mist Blower", hsn_code: "8424", unit_price: 12000, unit: "Per Unit", description: "High pressure mist blower for orchards", category: "Sprayers", stock: 25 },

  // FMCG Products
  { name: "Sikko Dishwash Liquid", hsn_code: "3402", unit_price: 85, unit: "Per Litre", description: "Concentrated dish washing liquid", category: "FMCG Products", stock: 500 },
  { name: "Sikko Floor Cleaner", hsn_code: "3402", unit_price: 65, unit: "Per Litre", description: "Disinfectant floor cleaner", category: "FMCG Products", stock: 600 },
  { name: "Sikko Liquid Detergent", hsn_code: "3402", unit_price: 120, unit: "Per Litre", description: "Premium liquid laundry detergent", category: "FMCG Products", stock: 400 },
  { name: "Sikko Hand Wash", hsn_code: "3401", unit_price: 95, unit: "Per Litre", description: "Antibacterial hand wash liquid", category: "FMCG Products", stock: 350 },

  // Household Products
  { name: "Sikko Rat Kill Cake", hsn_code: "3808", unit_price: 45, unit: "Per Piece", description: "Rodent control bait cake", category: "Household Products", stock: 1000 },
  { name: "Sikko Cockroach Gel", hsn_code: "3808", unit_price: 180, unit: "Per Unit", description: "Premium cockroach killer gel", category: "Household Products", stock: 300 },
  { name: "Sikko Mosquito Repellent", hsn_code: "3808", unit_price: 150, unit: "Per Litre", description: "Mosquito repellent liquid", category: "Household Products", stock: 400 },
  { name: "Sikko Termite Guard", hsn_code: "3808", unit_price: 350, unit: "Per Litre", description: "Anti-termite solution for wood protection", category: "Household Products", stock: 200 },
];

async function seedProducts() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "",
    database: process.env.DB_NAME || "invoice_db",
    port: process.env.DB_PORT || 3306,
  });

  try {
    // Get user ID 1 (or first available user)
    const [users] = await pool.query("SELECT id FROM users ORDER BY id LIMIT 1");
    if (users.length === 0) {
      console.log("❌ No users found. Please sign up first, then run this script.");
      process.exit(1);
    }
    const userId = users[0].id;
    console.log(`📦 Seeding ${PRODUCTS.length} products for user ID ${userId}...\n`);

    for (const p of PRODUCTS) {
      // Check if product already exists
      const [existing] = await pool.query("SELECT id FROM products WHERE name = ?", [p.name]);
      if (existing.length > 0) {
        console.log(`  ⏭️  Skip (exists): ${p.name}`);
        continue;
      }
      await pool.query(
        "INSERT INTO products (user_id, name, hsn_code, unit_price, unit, description, category, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [userId, p.name, p.hsn_code, p.unit_price, p.unit, p.description, p.category, p.stock]
      );
      console.log(`  ✅ Added: ${p.name} — ₹${p.unit_price} ${p.unit} [${p.category}]`);
    }

    console.log(`\n🎉 Done! ${PRODUCTS.length} Sikko Industries products seeded.`);
  } catch (err) {
    console.error("❌ Seed error:", err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

seedProducts();
