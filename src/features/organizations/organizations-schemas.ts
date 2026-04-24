import { id } from "@lib/z";

// Better Auth generates organization ids with mixed-case alphanumeric characters.
export const organizationIdSchema = id;
