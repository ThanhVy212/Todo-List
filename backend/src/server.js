import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./libs/db.js";
import taskRoutes from "./routes/taskRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

app.use("/api/tasks", taskRoutes);

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Listening on port http://localhost:${port}`);
  });
});
