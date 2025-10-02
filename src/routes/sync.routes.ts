import { Router } from 'express';
import { SyncController } from '../controllers/sync.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';

export class SyncRoutes {

    static get routes() {
        const router = Router();

        // Sincronización manual
        router.post('/sync/manual',
            authenticateToken,
            asyncHandler(SyncController.manualSync)
        );

        // Estado de sincronización
        router.get('/sync/status',
            authenticateToken,
            asyncHandler(SyncController.getSyncStatus)
        );

        // Historial de sincronizaciones
        router.get('/sync/history',
            authenticateToken,
            asyncHandler(SyncController.getSyncHistory)
        );

        return router;
    }
}