import express from "express";
import cors from "cors"; 
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";
import productionRoutes from "./routes/productionRoutes.js";
import salesRoutes from "./routes/salesRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import qcRoutes from "./routes/qcRoutes.js";
import stockMovementRoutes from "./routes/stockMovementRoutes.js";
import yarnRoutes from "./routes/yarnRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import jobWorkRoutes from "./routes/jobWorkRoutes.js";


const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/purchase", purchaseRoutes);
app.use("/api/production", productionRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/qc", qcRoutes);
app.use("/api/stock-movement", stockMovementRoutes);
app.use("/api/yarn", yarnRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/job-work", jobWorkRoutes);

export default app;
