import express from "express";
import businessRouter from "./routes/businesses.js";
import healthRouter from "./routes/health.js";

export const app = express();

app.use(express.json());
app.use(healthRouter);
app.use(businessRouter);
