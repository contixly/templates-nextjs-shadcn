import { z } from "zod";

// Better Auth generates organization ids with mixed-case alphanumeric characters.
export const organizationIdSchema = z.string().regex(/^[A-Za-z0-9]+$/, "Invalid organization ID");
