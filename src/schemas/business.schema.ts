import { z } from "zod";

export const createBusinessSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  category: z.string().max(100).optional(),
  city: z.string().min(1, "City is required").max(100),
  phone: z.string().max(50).optional(),
  websiteUrl: z.string().url("Invalid URL format").optional(),
});

export const updateBusinessSchema = createBusinessSchema.partial();

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
