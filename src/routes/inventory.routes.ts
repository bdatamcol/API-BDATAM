import { Router } from 'express';
import { getInventory, getInventoryGrouped } from '../controllers/inventory.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';
import { asyncHandler } from '../middlewares/error.middleware';

export class InventoryRoutes {

    static get routes() {

        const router = Router();
        
        router.get('/inventario',
            authenticateToken,
            ValidationMiddleware.paginationValidation,
            asyncHandler(getInventory)
        );

        router.get('/inventario/marcas',
            authenticateToken,
            ValidationMiddleware.paginationValidation,
            asyncHandler(getInventoryGrouped)
        );
        
        return router;
    }

}