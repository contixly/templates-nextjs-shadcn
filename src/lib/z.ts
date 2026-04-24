import { z } from "zod";

export const id = z.string().regex(/^[A-Za-z0-9]+$/, "Invalid ID");
