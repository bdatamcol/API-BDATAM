import { Request, Response } from "express";
import { getPool } from "../data";
import { AppError } from '../middlewares/error.middleware';

/**
 * @swagger
 * definitions:
 *   SyncRequest:
 *     type: object
 *     properties:
 *       productCodes:
 *         type: array
 *         items:
 *           type: string
 *         description: Códigos de productos a sincronizar (formato "codigo:precio:stock")
 *   
 *   SyncResult:
 *     type: object
 *     properties:
 *       success:
 *         type: boolean
 *       synchronized:
 *         type: array
 *         items:
 *           type: string
 *       errors:
 *         type: array
 *         items:
 *           type: string
 *       summary:
 *         type: object
 *         properties:
 *           total:
 *             type: integer
 *           successful:
 *             type: integer
 *           failed:
 *             type: integer
 */

interface SyncRequest {
    productCodes: string[];
}

interface SyncResult {
    success: boolean;
    synchronized: string[];
    errors: string[];
    summary: {
        total: number;
        successful: number;
        failed: number;
    };
}

export class SyncController {

    /**
     * @swagger
     * /sync/manual:
     *   post:
     *     summary: Sincronización manual de productos
     *     description: Sincroniza productos específicos entre Novasoft y Tienda Virtual
     *     tags: [Sincronización]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/definitions/SyncRequest'
     *     responses:
     *       200:
     *         description: Sincronización completada
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/definitions/SyncResult'
     */
    static async manualSync(req: Request, res: Response) {
        try {
            const { productCodes }: SyncRequest = req.body;

            if (!productCodes || !Array.isArray(productCodes)) {
                throw new AppError('Se requiere un array de códigos de productos', 400);
            }

            const synchronized: string[] = [];
            const errors: string[] = [];

            // Migrar lógica de syncnstv.php
            for (const productData of productCodes) {
                try {
                    const [code, price, stock] = productData.split(':');

                    if (!code || !price || !stock) {
                        errors.push(`Formato inválido para producto: ${productData}`);
                        continue;
                    }

                    // TODO: Implementar updateTV() - actualizar en MySQL WordPress
                    const updateResult = await SyncController.updateVirtualStore(
                        code.trim(),
                        parseFloat(price),
                        parseInt(stock)
                    );

                    if (updateResult) {
                        synchronized.push(code.trim());
                    } else {
                        errors.push(`Error al sincronizar: ${code}`);
                    }

                } catch (error) {
                    errors.push(`Error al procesar: ${productData}`);
                }
            }

            const result: SyncResult = {
                success: errors.length === 0,
                synchronized,
                errors,
                summary: {
                    total: productCodes.length,
                    successful: synchronized.length,
                    failed: errors.length
                }
            };

            res.json(result);

        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('Error en sincronización manual', 500);
        }
    }

    /**
     * @swagger
     * /sync/status:
     *   get:
     *     summary: Estado de sincronización
     *     description: Obtiene el estado actual de la sincronización
     *     tags: [Sincronización]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Estado obtenido exitosamente
     */
    static async getSyncStatus(req: Request, res: Response) {
        try {
            // Obtener productos de Novasoft
            const pool = await getPool();
            const request = pool.request();
            request.input('bodega', '076');
            request.input('sucursal', 'CUC');

            const novasoftResult = await request.execute('Consulta_Bodega_existencia');
            const novasoftProducts = novasoftResult.recordset;

            // TODO: Comparar con productos de Tienda Virtual
            const status = {
                lastSync: new Date().toISOString(),
                novasoftProducts: novasoftProducts.length,
                virtualStoreProducts: 0, // TODO: Obtener de MySQL
                synchronized: 0, // TODO: Calcular productos sincronizados
                needsSync: 0, // TODO: Calcular productos que necesitan sincronización
                errors: []
            };

            res.json({
                success: true,
                data: status
            });

        } catch (error) {
            throw new AppError('Error obteniendo estado de sincronización', 500);
        }
    }

    /**
     * @swagger
     * /sync/history:
     *   get:
     *     summary: Historial de sincronizaciones
     *     description: Obtiene el historial de sincronizaciones realizadas
     *     tags: [Sincronización]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Historial obtenido exitosamente
     */
    static async getSyncHistory(req: Request, res: Response) {
        try {
            // TODO: Implementar tabla de historial de sincronizaciones
            const history = [
                {
                    id: 1,
                    timestamp: new Date().toISOString(),
                    type: 'manual',
                    productsProcessed: 0,
                    successful: 0,
                    failed: 0,
                    user: 'admin'
                }
            ];

            res.json({
                success: true,
                data: history
            });

        } catch (error) {
            throw new AppError('Error obteniendo historial de sincronización', 500);
        }
    }

    // Método privado para actualizar Tienda Virtual (migrar updateTV del PHP)
    private static async updateVirtualStore(code: string, price: number, stock: number): Promise<boolean> {
        try {
            // TODO: Implementar conexión a MySQL y lógica de genSql()
            // Migrar las funciones genSql() y updateTV() del PHP

            // Por ahora retornamos true como placeholder
            return true;

        } catch (error) {
            return false;
        }
    }
}