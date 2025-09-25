import express, { Router } from 'express';
import path from 'path';
import cors from 'cors';
import {envs} from './config/envs';
import { InventoryRoutes } from './routes/inventory.routes';

const app = express();

// parseo de body
app.use(express.json());

// cors
app.use(cors());

// rutas
app.use('/api/inventario', InventoryRoutes.routes);

const PORT = envs.port || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API corriendo en http://localhost:${PORT}`);
});
