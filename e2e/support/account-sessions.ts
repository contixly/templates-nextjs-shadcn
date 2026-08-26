import "dotenv/config";
import { expect } from "@playwright/test";
import { Pool } from "pg";

export const ageUserSessionsBeyondDefaultFreshness = async (userId: string) => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required for account session E2E setup");
  }

  const pool = new Pool({ connectionString, max: 1 });

  try {
    const result = await pool.query('UPDATE "sessions" SET "createdAt" = $1 WHERE "userId" = $2', [
      new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      userId,
    ]);

    expect(result.rowCount, `Expected to age at least one session for ${userId}`).toBeGreaterThan(
      0
    );
  } finally {
    await pool.end();
  }
};

export const restoreUserSessionFreshness = async (userId: string) => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required for account session E2E cleanup");
  }

  const pool = new Pool({ connectionString, max: 1 });

  try {
    await pool.query('UPDATE "sessions" SET "createdAt" = $1 WHERE "userId" = $2', [
      new Date(),
      userId,
    ]);
  } finally {
    await pool.end();
  }
};
