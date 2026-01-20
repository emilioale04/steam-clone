import { exec } from "child_process";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// Asegurar carpeta backups
const backupsDir = path.resolve("backups");
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir);
}

// Nombre del archivo
const fileName = `backup_${new Date().toISOString().slice(0, 10)}.dump`;
const outputPath = path.join(backupsDir, fileName);

// Comando en UNA sola línea
const command = `pg_dump -h ${process.env.DB_HOST} -U ${process.env.DB_USER} -d ${process.env.DB_NAME} -p ${process.env.DB_PORT} -F c -f "${outputPath}"`;

console.log("📦 Iniciando backup...");
console.log("📍 Ruta:", outputPath);

exec(
  command,
  {
    env: {
      ...process.env,
      PGPASSWORD: process.env.DB_PASSWORD
    }
  },
  (error, stdout, stderr) => {
    if (error) {
      console.error("❌ Error al generar el backup:");
      console.error(stderr || error.message);
      return;
    }

    console.log("✅ Backup generado correctamente");
  }
);
