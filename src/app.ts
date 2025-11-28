import https from "https";
import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { envs } from "./config/envs";
import { InventoryRoutes } from "./routes/inventory.routes";
import { AuthRoutes } from "./routes/auth.routes";
import { ApiKeyMiddleware } from "./middlewares/apikey.middleware";
import swaggerUI from "swagger-ui-express";
const swaggerDocument = require("../swagger-output.json");
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { InvoiceRoutes } from "./routes/invoice.routes";
import { ProductsRoutes } from "./routes/products.routes";
import { SyncRoutes } from "./routes/sync.routes";
import { JapolandiaListRoutes } from "./routes/japolandia-list.routes";
import { GarantyExtRoutes } from "./routes/garanty-ext.route";

const corsOptions = {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
    credentials: true
};

const app = express();

app.enable("trust proxy");
// Seguridad - Helmet
// Helmet global (duro) para tu API
app.use(helmet({
    contentSecurityPolicy: false, // por ahora desactiva CSP
    hsts: false, // evita forzar HTTPS
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// --- Swagger: Helmet específico y relajado SOLO para /api/docs ---
const swaggerHelmet = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],     // swagger-ui inyecta estilos inline
            scriptSrc: ["'self'", "'unsafe-inline'"],    // swagger-ui inyecta script inline
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
});

// parseo de body
app.use(express.json());

// cors
app.use(cors(corsOptions));

// rutas
app.use("/api", AuthRoutes.routes);
app.use("/api", InventoryRoutes.routes);
app.use("/api", InvoiceRoutes.routes);
app.use("/api", ProductsRoutes.routes);
app.use("/api", SyncRoutes.routes);
app.use("/api", JapolandiaListRoutes.routes);
app.use("/api", GarantyExtRoutes.routes);

// documentación de la API - control por variable de entorno
if (envs.docsPublic) {
    app.use("/api/docs", swaggerHelmet, swaggerUI.serve, swaggerUI.setup(swaggerDocument));
} else if (process.env.NODE_ENV === "production") {
    app.use("/api/docs", swaggerHelmet, ApiKeyMiddleware.validateApiKey, swaggerUI.serve, swaggerUI.setup(swaggerDocument));
} else {
    app.use("/api/docs", swaggerHelmet, swaggerUI.serve, swaggerUI.setup(swaggerDocument));
}

// Middleware de manejo de errores (debe ir después de todas las rutas)
app.use(errorHandler);

// Middleware para rutas no encontradas (debe ir al final)
app.use(notFoundHandler);

const PORT = Number(envs.port || 3000);
app.listen(PORT, () => {
    console.log(`🚀 API corriendo en http://localhost:${PORT}`);
    console.log(`📚 Docs: http://localhost:${PORT}/api/docs`);
});

const HTTPS_PORT = Number(process.env.HTTPS_PORT || 3443);
const keyPath = path.resolve(__dirname, "../certs/key.pem");
const certPath = path.resolve(__dirname, "../certs/cert.pem");

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    const creds = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
    };
    https.createServer(creds, app).listen(HTTPS_PORT, () => {
        console.log(`🔒 HTTPS corriendo en https://localhost:${HTTPS_PORT}`);
        console.log(`📚 Docs (HTTPS): https://localhost:${HTTPS_PORT}/api/docs`);
    });
} else {
    console.warn("⚠️ No se encontraron certs en /certs. Solo HTTP.");
}