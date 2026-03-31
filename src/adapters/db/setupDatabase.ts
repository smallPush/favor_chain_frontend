// Archivo: src/adapters/db/setupDatabase.ts
import postgres from "postgres";

export async function setupDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.warn("⚠️ DATABASE_URL no definida. Saltando la auto-configuración de base de datos.");
    return;
  }

  console.log(`🔗 URL de conexión leída: ${connectionString}`);


  console.log("🛠 Conectando a Postgres/Supabase y verificando tablas...");

  const sql = postgres(connectionString, { ssl: "require" });

  try {
    // Usamos el método interno de postgres.js para ejecutar un script entero
    await sql.file("database_schema.sql");
    console.log("✅ Estructura de Supabase asegurada con éxito.");
  } catch (error) {
    console.error("❌ Hubo un fallo en la migración de base de datos:", error);
  } finally {
    await sql.end();
  }
}
