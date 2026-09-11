import { Router } from "express";
import { db } from "../prisma/db.js";
import {
  createBusinessSchema,
  updateBusinessSchema,
} from "../schemas/business.schema.js";

const businessRouter = Router();

// POST /businesses — create a new business
businessRouter.post("/businesses", async (req, res) => {
  const parsed = createBusinessSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const business = await db.business.create({
    data: parsed.data,
  });

  res.status(201).json(business);
});

// GET /businesses — list all businesses
businessRouter.get("/businesses", async (_req, res) => {
  const businesses = await db.business.findMany({
    orderBy: { createdAt: "desc" },
  });

  res.json(businesses);
});

// GET /businesses/:id — get one business by ID
businessRouter.get("/businesses/:id", async (req, res) => {
  const business = await db.business.findUnique({
    where: { id: req.params.id },
  });

  if (!business) {
    res.status(404).json({ error: "Business not found" });
    return;
  }

  res.json(business);
});

// PATCH /businesses/:id — update a business
businessRouter.patch("/businesses/:id", async (req, res) => {
  const parsed = updateBusinessSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const existing = await db.business.findUnique({
    where: { id: req.params.id },
  });

  if (!existing) {
    res.status(404).json({ error: "Business not found" });
    return;
  }

  const updated = await db.business.update({
    where: { id: req.params.id },
    data: parsed.data,
  });

  res.json(updated);
});

// DELETE /businesses/:id — delete a business
businessRouter.delete("/businesses/:id", async (req, res) => {
  const existing = await db.business.findUnique({
    where: { id: req.params.id },
  });

  if (!existing) {
    res.status(404).json({ error: "Business not found" });
    return;
  }

  await db.business.delete({
    where: { id: req.params.id },
  });

  res.status(204).send();
});

export default businessRouter;
