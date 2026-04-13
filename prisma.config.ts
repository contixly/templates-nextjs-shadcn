import "dotenv/config";
import { defineConfig } from "prisma/config";

const FALLBACK_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/postgres";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? FALLBACK_DATABASE_URL,
  },
});
