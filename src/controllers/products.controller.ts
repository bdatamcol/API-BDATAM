import { Request, Response } from 'express';
import { executeQuery } from '../data';

interface NovasoftProduct {
    cod_item: string;
    des_item: string;
    existencia: number;
}

interface PriceListItem {
    cod_lis: string;
    cod_item: string;
    precioiva: number;
}

interface VirtualStoreProduct {
    post_id: number;
    meta_key: string;
    meta_value: string;
}

interface ProductComparison {
    codigo: string;
    descripcion: string;
    precioAnteriorNS: number;
    precioActualNS: number;
    stockNS: number;
    precioAnteriorTV: number;
    precioActualTV: number;
    stockTV: number;
    estado: 'sincronizado' | 'no_sincronizado' | 'no_existe_tv';
    necesitaSync: boolean;
}

export class ProductsController {

    // Obtener productos de Novasoft (WebVentas)
    static async getNovasoftProducts(req: Request, res: Response) {
        try {
            const { bodega = '080', sucursal = 'cuc', empresa = 'cbb sas' } = req.query;

            const query = `EXEC Consulta_Bodega_existencia '${bodega}', '${sucursal}', '${empresa}'`;

            // Ejecutar en la base de datos WebVentas
            const result = await executeQuery(query, [], 'WebVentas');

            res.json({
                success: true,
                data: result.recordset,
                count: result.recordset.length
            });
        } catch (error) {
            console.error('Error getting Novasoft products:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener productos de Novasoft',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // Obtener lista de precios de Novasoft (WebVentas)
    static async getPriceList(req: Request, res: Response) {
        try {
            const { lista = '080', sucursal = 'cuc' } = req.query;

            const query = `EXEC Consulta_Listas '${lista}', '${sucursal}'`;

            // Ejecutar en la base de datos WebVentas
            const result = await executeQuery(query, [], 'WebVentas');

            res.json({
                success: true,
                data: result.recordset,
                count: result.recordset.length
            });
        } catch (error) {
            console.error('Error getting price list:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener lista de precios',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // Obtener productos con precios procesados (migra la lógica de main.php)
    static async getProductsWithPrices(req: Request, res: Response) {
        try {
            const { bodega = '080', sucursal = 'cuc', empresa = 'cbb sas' } = req.query;

            // Obtener productos de Novasoft
            const productsQuery = `EXEC Consulta_Bodega_existencia '${bodega}', '${sucursal}', '${empresa}'`;
            const productsResult = await executeQuery(productsQuery, [], 'WebVentas');

            // Obtener lista de precios
            const pricesQuery = `EXEC Consulta_Listas '${bodega}', '${sucursal}'`;
            const pricesResult = await executeQuery(pricesQuery, [], 'WebVentas');

            // Procesar precios (migra la lógica de main.php líneas 104-113)
            const precioAnterior: { [key: string]: number } = {};
            const precioActual: { [key: string]: number } = {};

            pricesResult.recordset.forEach((row: PriceListItem) => {
                const codigo = row.cod_item.trim();
                if (row.cod_lis === '22') {
                    precioAnterior[codigo] = Math.round(row.precioiva);
                } else if (row.cod_lis === '05') {
                    precioActual[codigo] = Math.round(row.precioiva);
                }
            });

            // Procesar productos (migra la lógica de main.php líneas 121-129)
            const processedProducts: any[] = [];
            let todosLosCod = '';

            productsResult.recordset.forEach((row: NovasoftProduct) => {
                const codigo = row.cod_item.trim();

                if (Math.round(row.existencia) >= 0 && !codigo.includes('/')) {
                    const precioAnt = Math.round(precioAnterior[codigo] || 0);
                    const precioAct = Math.round(precioActual[codigo] || 0);
                    const existencia = Math.round(row.existencia);

                    // Construir string como en PHP (línea 128)
                    todosLosCod += `${codigo}:${precioAct}:${existencia}:${precioAnt},`;

                    processedProducts.push({
                        codigo: codigo,
                        descripcion: row.des_item,
                        precioAnterior: precioAnt,
                        precioActual: precioAct,
                        existencia: existencia
                    });
                }
            });

            res.json({
                success: true,
                data: processedProducts,
                count: processedProducts.length,
                todosLosCod: todosLosCod.slice(0, -1) // Remover la última coma
            });
        } catch (error) {
            console.error('Error getting products with prices:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener productos con precios',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // Obtener productos de Virtual Store (placeholder para MySQL)
    static async getVirtualStoreProducts(req: Request, res: Response) {
        try {
            const { cods } = req.body;

            if (!cods) {
                return res.status(400).json({
                    success: false,
                    message: 'Códigos de productos requeridos'
                });
            }

            // TODO: Implementar conexión MySQL para WordPress/WooCommerce
            // Esta función migrará la lógica de ws/getProdTV.php

            res.json({
                success: true,
                message: 'Funcionalidad pendiente: conexión MySQL para Virtual Store',
                data: [],
                note: 'Necesita implementar conexión MySQL para consultar wp_postmeta'
            });
        } catch (error) {
            console.error('Error getting Virtual Store products:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener productos del Virtual Store',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // Comparar productos entre Novasoft y Virtual Store
    static async compareProducts(req: Request, res: Response) {
        try {
            const { cods } = req.body;

            if (!cods) {
                return res.status(400).json({
                    success: false,
                    message: 'Códigos de productos requeridos'
                });
            }

            // TODO: Implementar lógica de comparación completa
            // Esta función migrará la lógica de comparaProd() en getProdTV.php

            const comparisons: ProductComparison[] = [];
            const productosParaSync: string[] = [];

            res.json({
                success: true,
                message: 'Funcionalidad pendiente: comparación completa de productos',
                data: {
                    comparisons,
                    productosParaSync,
                    totalComparisons: 0,
                    sincronizados: 0,
                    noSincronizados: 0,
                    noExistenEnTV: 0
                }
            });
        } catch (error) {
            console.error('Error comparing products:', error);
            res.status(500).json({
                success: false,
                message: 'Error al comparar productos',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // Ejemplo de consulta a otra base de datos
    static async getDataFromOtherDatabase(req: Request, res: Response) {
        try {
            const { database, query: customQuery } = req.body;

            if (!database || !customQuery) {
                return res.status(400).json({
                    success: false,
                    message: 'Database y query son requeridos'
                });
            }

            // Ejecutar en la base de datos especificada
            const result = await executeQuery(customQuery, [], database);

            res.json({
                success: true,
                data: result.recordset,
                count: result.recordset.length,
                database: database
            });
        } catch (error) {
            console.error('Error executing custom query:', error);
            res.status(500).json({
                success: false,
                message: 'Error al ejecutar consulta personalizada',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}