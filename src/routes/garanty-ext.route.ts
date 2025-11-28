import { Router } from "express";
import { GarantyExtController } from "../controllers/garanty-ext.controller";
import { ValidationMiddleware } from "../middlewares/validation.middleware";
import { authenticateToken } from "../middlewares/auth.middleware";


export class GarantyExtRoutes {

    static get routes() {
        const router = Router();
        router.get(
            "/garanty-ext-list",
            authenticateToken,
            ValidationMiddleware.paginationValidation,
            GarantyExtController.getGarantyExtList
        );
        return router;
    }

}

