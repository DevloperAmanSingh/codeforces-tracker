import express from "express";
import cors from "cors";
import studentRoutes from "./routes/student.routes";
import syncRoutes from "./routes/sync.routes";
import analyticsRoutes from "./routes/analytics.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/students", studentRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);

export default app;

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
