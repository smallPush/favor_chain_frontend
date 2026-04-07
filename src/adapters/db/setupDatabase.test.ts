import { describe, expect, test, mock, afterEach, beforeEach, spyOn } from "bun:test";
import { setupDatabase } from "./setupDatabase";

const mockFile = mock().mockResolvedValue(undefined);
const mockEnd = mock().mockResolvedValue(undefined);

mock.module("postgres", () => {
  return {
    default: mock().mockImplementation(() => {
      return {
        file: mockFile,
        end: mockEnd,
      };
    }),
  };
});

describe("setupDatabase", () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "postgres://fake-url";
    mockFile.mockClear();
    mockEnd.mockClear();
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.DATABASE_URL = originalEnv;
    } else {
      delete process.env.DATABASE_URL;
    }
    // Restore all spies
    mock.restore();
  });

  test("should skip if DATABASE_URL is not defined", async () => {
    delete process.env.DATABASE_URL;
    const consoleWarnSpy = spyOn(console, "warn").mockImplementation(() => {});

    await setupDatabase();

    expect(consoleWarnSpy).toHaveBeenCalledWith("⚠️ DATABASE_URL no definida. Saltando la auto-configuración de base de datos.");
    expect(mockFile).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  test("should execute script and log success", async () => {
    const consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});

    await setupDatabase();

    expect(mockFile).toHaveBeenCalledWith("database_schema.sql");
    expect(consoleLogSpy).toHaveBeenCalledWith("✅ Estructura de Supabase asegurada con éxito.");
    expect(mockEnd).toHaveBeenCalled();

    consoleLogSpy.mockRestore();
  });

  test("should handle error during migration", async () => {
    const error = new Error("Migration failed");
    mockFile.mockRejectedValueOnce(error);

    const consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});
    const consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});

    await setupDatabase();

    expect(mockFile).toHaveBeenCalledWith("database_schema.sql");
    expect(consoleErrorSpy).toHaveBeenCalledWith("❌ Hubo un fallo en la migración de base de datos:", error);
    expect(mockEnd).toHaveBeenCalled(); // finally block executes

    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
