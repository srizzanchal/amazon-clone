import "dotenv/config";
import { checkEnv } from "./config/env.js";
import connectDB from "./config/db.js";

checkEnv(); // fail fast on missing/weak configuration before anything else loads

const { default: app } = await import("./app.js");
await connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on port ${PORT} (${process.env.NODE_ENV || "development"})`));
