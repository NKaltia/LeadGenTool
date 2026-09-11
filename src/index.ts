import express from "express";
import healthRouter from "./routes/health.js";
import businessRouter from "./routes/businesses.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use(healthRouter);
app.use(businessRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
