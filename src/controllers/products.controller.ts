import { Request, Response } from 'express';
import { executeQuery, executeMySQLQuery } from '../data';

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

            const query = `EXEC Consulta_Bodega_existencia_bdatam '${bodega}', '${sucursal}', '${empresa}'`;

            // Ejecutar en la base de datos WebVentas
            const result = await executeQuery(query, [], 'WebVentas');

            res.json({
                success: true,
                data: result.recordset,
                count: result.recordset.length
            });
        } catch (error) {
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

            if (!cods || typeof cods !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Códigos de productos requeridos en formato string: "cod:precioNS:stockNS:precioAntesNS,..."'
                });
            }

            // Import dinámico para evitar romper si tu archivo de conexión tiene otro nombre

            const lista = cods.trim().replace(/,$/, '').split(',');
            const comparisons: Array<{
                codigo: string;
                precioNS: number;
                stockNS: number;
                precioAntesNS: number;
                precioRegularTV: number;
                precioVentaTV: number;
                stockTV: number;
                precioActualTV: number;
                estado: 'sincronizado' | 'no_sincronizado' | 'no_existe_tv';
                necesitaSync: boolean;
            }> = [];

            let todosProdSync = ''; // Solo agregamos cuando existe en TV y no está sincronizado

            // Consultas por cada código (similar a ws/getProdTV.php)
            await Promise.all(
                lista.map(async (itemRaw) => {
                    const [codprod, precioNSRaw, stockNSRaw, precioAntesNSRaw] = itemRaw.split(':');
                    const cod = (codprod || '').trim();
                    const precioNS = Math.round(Number(precioNSRaw || 0));
                    const stockNS = Math.ceil(Number(stockNSRaw || 0));
                    const precioAntesNS = Math.round(Number(precioAntesNSRaw || 0));

                    if (!cod) return;

                    // Query basado en ws/getProdTV.php (usando LIKE para coincidir con SKU/EAN)
                    const sql = `
                        SELECT meta_key, meta_value
                        FROM wp_postmeta
                        WHERE meta_key IN ('_regular_price', '_sale_price', '_stock', '_price')
                          AND post_id = (
                              SELECT post_id FROM wp_postmeta
                              WHERE (meta_key = '_sku' OR meta_key = '_alg_ean')
                                AND meta_value LIKE ?
                              LIMIT 1
                          )
                    `;
                    const rows = await executeMySQLQuery(sql, [cod]) as Array<{ meta_key: string; meta_value: string }>;

                    if (!rows || rows.length === 0) {
                        // No está en tienda virtual
                        comparisons.push({
                            codigo: cod,
                            precioNS,
                            stockNS,
                            precioAntesNS,
                            precioRegularTV: 0,
                            precioVentaTV: 0,
                            stockTV: 0,
                            precioActualTV: 0,
                            estado: 'no_existe_tv',
                            necesitaSync: true
                        });
                        return;
                    }

                    // Parsear metadatos
                    let precioRegularTV = 0;
                    let precioVentaTV = 0;
                    let stockTV = 0;
                    let precioActualTV = 0;

                    for (const r of rows) {
                        if (r.meta_key === '_regular_price') precioRegularTV = Math.round(Number(r.meta_value || 0));
                        else if (r.meta_key === '_sale_price') precioVentaTV = Math.round(Number(r.meta_value || 0));
                        else if (r.meta_key === '_stock') stockTV = Math.ceil(Number(r.meta_value || 0));
                        else if (r.meta_key === '_price') precioActualTV = Math.round(Number(r.meta_value || 0));
                    }

                    // Comparación (migra comparaProd del PHP)
                    const preciosIguales = precioNS === precioActualTV;
                    const stocksIguales = stockNS === stockTV;
                    const precioAnteriorIgual = precioAntesNS === precioRegularTV;

                    const sincronizado = preciosIguales && stocksIguales && precioAnteriorIgual;

                    comparisons.push({
                        codigo: cod,
                        precioNS,
                        stockNS,
                        precioAntesNS,
                        precioRegularTV,
                        precioVentaTV,
                        stockTV,
                        precioActualTV,
                        estado: sincronizado ? 'sincronizado' : 'no_sincronizado',
                        necesitaSync: !sincronizado
                    });

                    // En PHP solo agrega a todosProdSync cuando existe y no está sincronizado
                    if (!sincronizado) {
                        todosProdSync += `${cod}:${precioNS}:${stockNS}:${precioAntesNS},`;
                    }
                })
            );

            // Resumen
            const total = comparisons.length;
            const sincronizados = comparisons.filter(c => c.estado === 'sincronizado').length;
            const noSincronizados = comparisons.filter(c => c.estado === 'no_sincronizado').length;
            const noExistenEnTV = comparisons.filter(c => c.estado === 'no_existe_tv').length;

            res.json({
                success: true,
                data: comparisons,
                resumen: {
                    total,
                    sincronizados,
                    noSincronizados,
                    noExistenEnTV
                },
                productosParaSync: todosProdSync.replace(/,$/, '') // quitar la última coma
            });
        } catch (error) {
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
            res.status(500).json({
                success: false,
                message: 'Error al ejecutar consulta personalizada',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}