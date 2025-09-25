import { Router } from 'express';
import { getInventory } from '../controllers/inventory.controller';


export class InventoryRoutes {

    static get routes() {

        const router = Router();
        
        router.get('/inventario', getInventory);
        
        return router;
    }

}