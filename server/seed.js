// Loads demo categories + products and (optionally) an admin account.
//   npm run seed
// Admin account: set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env before running. Nothing is hardcoded.
import "dotenv/config";
import mongoose from "mongoose";
import Product from "./models/Product.js";
import Category from "./models/Category.js";
import Review from "./models/Review.js";
import User from "./models/User.js";
import { email as validEmail, password as validPassword } from "./utils/validate.js";

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is not set (see server/.env.example)");
  process.exit(1);
}

const img = (t) => `https://placehold.co/600x600/f3f3f3/131921?text=${encodeURIComponent(t)}`;

// [name, brand, category, price (INR), stock, description]
const data = [
  ["Wireless Bluetooth Earbuds", "Nova", "Electronics", 1499, 25, "True wireless earbuds with 24-hour battery life, touch controls and a compact charging case."],
  ["Smart Fitness Band", "Zenith", "Electronics", 2299, 40, "Track steps, heart rate and sleep with a bright AMOLED display and 10-day battery."],
  ["20000 mAh Power Bank", "Voltix", "Electronics", 1799, 60, "Fast-charging power bank with dual USB-A and USB-C ports."],
  ["Portable Bluetooth Speaker", "Nova", "Electronics", 2599, 18, "Water-resistant speaker with deep bass and 12 hours of playtime."],
  ["Mechanical Keyboard", "KeyForge", "Electronics", 3499, 12, "Compact 75% mechanical keyboard with hot-swappable switches and RGB backlight."],
  ["Clean Code Handbook", "PageTurner", "Books", 599, 80, "A practical guide to writing readable, maintainable software."],
  ["Data Structures Made Simple", "PageTurner", "Books", 449, 55, "Visual explanations and interview-style problems for core data structures."],
  ["Atomic Habits Journal", "Inkwell", "Books", 349, 100, "Daily habit tracker and reflection journal with a lay-flat binding."],
  ["Men's Cotton T-Shirt (Pack of 3)", "UrbanThread", "Fashion", 799, 120, "Soft breathable cotton tees in a regular fit. Machine washable."],
  ["Running Shoes", "StrideX", "Fashion", 2799, 30, "Lightweight cushioned running shoes with a breathable mesh upper."],
  ["Canvas Backpack 25L", "UrbanThread", "Fashion", 1199, 45, "Durable backpack with a padded 15-inch laptop sleeve and water-resistant base."],
  ["Stainless Steel Water Bottle 1L", "HydroPure", "Home & Kitchen", 499, 150, "Double-wall insulated bottle that keeps drinks cold for 24 hours."],
  ["Non-Stick Cookware Set (3 pcs)", "ChefMate", "Home & Kitchen", 2199, 22, "Induction-friendly non-stick frying pan, kadhai and tawa set."],
  ["Electric Kettle 1.5L", "ChefMate", "Home & Kitchen", 899, 70, "Auto shut-off stainless steel kettle with a concealed heating element."],
  ["Yoga Mat 6mm", "FlexFit", "Sports", 699, 90, "Anti-slip, extra-cushioned yoga mat with a carry strap."],
  ["Adjustable Dumbbell Set 20kg", "IronPeak", "Sports", 3299, 15, "Adjustable dumbbells with secure collars for home workouts."],
];

const products = data.map(([name, brand, category, price, countInStock, description]) => ({
  name, brand, category, price, countInStock, description, image: img(name),
}));
const categories = [...new Set(products.map((p) => p.category))].map((name) => ({ name }));

// Validate admin credentials (if given) BEFORE touching the database
let admin = null;
if (process.env.ADMIN_EMAIL || process.env.ADMIN_PASSWORD) {
  try {
    admin = { email: validEmail(process.env.ADMIN_EMAIL), password: validPassword(process.env.ADMIN_PASSWORD) };
  } catch (e) {
    console.error(`ADMIN_EMAIL / ADMIN_PASSWORD invalid: ${e.message}`);
    process.exit(1);
  }
}

await mongoose.connect(process.env.MONGO_URI);

// Demo catalogue is replaced on every seed. Ratings start at zero and are computed from real reviews.
await Promise.all([Product.deleteMany(), Category.deleteMany(), Review.deleteMany()]);
await Category.insertMany(categories);
await Product.insertMany(products);
console.log(`Seeded ${categories.length} categories and ${products.length} products`);

if (admin) {
  const existing = await User.findOne({ email: admin.email });
  if (existing) {
    existing.role = "admin";
    existing.password = admin.password; // re-hashed by the pre-save hook
    await existing.save();
    console.log(`Updated existing user ${admin.email} -> admin`);
  } else {
    await User.create({ name: "Admin", email: admin.email, password: admin.password, role: "admin" });
    console.log(`Created admin account ${admin.email}`);
  }
} else {
  console.log("No admin created. Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env and re-run, or use: npm run make-admin -- you@example.com");
}

await mongoose.disconnect();
