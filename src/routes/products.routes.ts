import { Router } from 'express';
import { ProductsController } from '../controllers/products.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';

export class ProductsRoutes {

    static get routes() {
        const router = Router();

        // Obtener productos de Novasoft
        router.get('/productos/novasoft',
            authenticateToken,
            asyncHandler(ProductsController.getNovasoftProducts)
        );

        // Obtener lista de precios
        router.get('/productos/lista-precios',
            authenticateToken,
            asyncHandler(ProductsController.getPriceList)
        );

        router.get('/con-precios',
            authenticateToken,
            asyncHandler(ProductsController.getProductsWithPrices));

        // Obtener productos de Tienda Virtual
        router.get('/productos/virtual-store',
            authenticateToken,
            asyncHandler(ProductsController.getVirtualStoreProducts)
        );

        // Comparar productos entre sistemas
        router.post('/productos/compare',
            authenticateToken,
            asyncHandler(ProductsController.compareProducts)
        );

        router.post('/custom-query',
            authenticateToken,
            asyncHandler(ProductsController.getDataFromOtherDatabase));

        return router;
    }
}