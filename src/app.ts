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

const corsOptions = {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
    credentials: true
};

const app = express();

// Seguridad - Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // límite de 100 requests por IP
    message: {
        success: false,
        error: 'Demasiadas solicitudes desde esta IP, por favor intente más tarde'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

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

// documentación de la API - proteger con API Key en producción
if (process.env.NODE_ENV === 'production') {
    app.use("/api/docs", ApiKeyMiddleware.validateApiKey, swaggerUI.serve, swaggerUI.setup(swaggerDocument));
} else {
    app.use("/api/docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));
}

// Middleware de manejo de errores (debe ir después de todas las rutas)
app.use(errorHandler);

// Middleware para rutas no encontradas (debe ir al final)
app.use(notFoundHandler);

const PORT = envs.port || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API corriendo en http://localhost:${PORT}`);
    console.log(`📚 Documentación de la API disponible en http://localhost:${PORT}/api/docs`);
    console.log(`🔑 Endpoints de autenticación disponibles en http://localhost:${PORT}/api/auth/login`);
    console.log(`🛡️  Seguridad: JWT + API Key habilitados`);
});
