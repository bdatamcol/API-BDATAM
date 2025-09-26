import express from "express";
import cors from "cors";
import { envs } from "./config/envs";
import { InventoryRoutes } from "./routes/inventory.routes";
import swaggerUI from "swagger-ui-express";
import swaggerDocument from "../swagger-output.json";

const corsOptions = {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

const app = express();

// parseo de body
app.use(express.json());

// cors
app.use(cors(corsOptions));

// rutas
app.use("/api", InventoryRoutes.routes);

// documentación de la API
app.use("/api/docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));

const PORT = envs.port || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API corriendo en http://localhost:${PORT}`);
    console.log(`📚 Documentación de la API disponible en http://localhost:${PORT}/api/docs`);
});
