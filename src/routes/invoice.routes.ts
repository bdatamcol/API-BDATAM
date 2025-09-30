import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { ValidationMiddleware } from "../middlewares/validation.middleware";
import { getInvoice } from "../controllers/invoice.controller";
import { asyncHandler } from "../middlewares/error.middleware";



export class InvoiceRoutes {

   static get routes() {
        const router = Router();
        router.get('/facturacion', 
            authenticateToken, 
            ValidationMiddleware.paginationValidation,
            asyncHandler(getInvoice)
        );
        return router;
   }
}