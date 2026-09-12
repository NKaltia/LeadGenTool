import { describe, expect, it } from "vitest";
import {
  createBusinessSchema,
  updateBusinessSchema,
} from "../../src/schemas/business.schema.js";

describe("business.schema", () => {
  describe("createBusinessSchema", () => {
    it("should accept valid business data", () => {
      const validData = {
        name: "Acme Services",
        category: "Consulting",
        city: "Berlin",
        phone: "+49 30 111111",
        websiteUrl: "https://acme.com",
      };

      const result = createBusinessSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Acme Services");
        expect(result.data.city).toBe("Berlin");
      }
    });

    it("should reject data when name is missing", () => {
      const invalidData = {
        city: "Berlin",
      };

      const result = createBusinessSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.name).toBeDefined();
      }
    });

    it("should reject data when city is missing", () => {
      const invalidData = {
        name: "Acme Services",
      };

      const result = createBusinessSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.city).toBeDefined();
      }
    });

    it("should reject invalid website URL format", () => {
      const invalidData = {
        name: "Acme Services",
        city: "Berlin",
        websiteUrl: "not-a-valid-url",
      };

      const result = createBusinessSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.websiteUrl).toContain("Invalid URL format");
      }
    });
  });

  describe("updateBusinessSchema", () => {
    it("should allow partial updates with only one field", () => {
      const partialData = {
        phone: "+49 30 999999",
      };

      const result = updateBusinessSchema.safeParse(partialData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.phone).toBe("+49 30 999999");
        expect(result.data.name).toBeUndefined();
      }
    });

    it("should allow an empty object for update", () => {
      const result = updateBusinessSchema.safeParse({});

      expect(result.success).toBe(true);
    });
  });
});
