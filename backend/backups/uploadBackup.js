import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// 1. Cliente Supabase (backend)
const supabase = createClient(
  process.env.SUPABASE_URL_STORAGE,
  process.env.SUPABASE_SERVICE_ROLE_KEY_STORAGE
);

// 2. Ruta del backup local
const backupsDir = path.resolve("backups");
const fileName = fs.readdirSync(backupsDir).find(f => f.endsWith(".dump"));

if (!fileName) {
  console.error("❌ No se encontró ningún archivo .dump en backups/");
  process.exit(1);
}

const filePath = path.join(backupsDir, fileName);

// 3. Leer archivo
const fileBuffer = fs.readFileSync(filePath);

// 4. Subir a Storage
console.log("⬆️ Subiendo backup a Supabase Storage...");

const { error } = await supabase.storage
  .from("db-backups")
  .upload(`backup/${fileName}`, fileBuffer, {
    contentType: "application/octet-stream",
    upsert: false
  });

if (error) {
  console.error("❌ Error al subir el backup:", error.message);
  process.exit(1);
}

console.log("✅ Backup subido correctamente a Supabase Storage");
console.log(`📦 Bucket: db-backups`);
console.log(`📄 Archivo: backup/${fileName}`);
