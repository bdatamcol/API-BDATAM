import { Request, Response } from "express";
import { getPool } from "../data";
import { buildPaginationLinks } from "../utils/pagination.utils";
import { AppError } from '../middlewares/error.middleware';

/**
 * @swagger
 * /inventario:
 *   get:
 *     summary: Obtener inventario con paginación
 *     description: Retorna el inventario de productos con soporte para filtros por ciudad y empresa
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Cantidad de registros por página
 *       - in: query
 *         name: ciudad
 *         schema:
 *           type: string
 *         description: Filtrar por ciudad
 *       - in: query
 *         name: empresa
 *         schema:
 *           type: string
 *         description: Filtrar por empresa
 *     responses:
 *       200:
 *         description: Inventario obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 next:
 *                   type: string
 *                   nullable: true
 *                 prev:
 *                   type: string
 *                   nullable: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: No autorizado - Token requerido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/ErrorResponse'
 */
export const getInventory = async (req: Request, res: Response) => {
    try {
        const { ciudad, empresa, nom_gru, page: pageQuery, limit: limitQuery } = req.query;

        // Parámetros de paginación con valores por defecto seguros
        const page = Math.max(1, parseInt((pageQuery as string) || "1", 10));
        const limit = Math.min(Math.max(1, parseInt((limitQuery as string) || "100", 10)), 1000); // Máximo 1000 registros
        const offset = (page - 1) * limit;

        const pool = await getPool();

        // Construir consulta SQL con filtros seguros
        let whereConditions = '';
        const conditions: string[] = [];
        const request = pool.request();

        if (ciudad && typeof ciudad === 'string' && ciudad.trim()) {
            conditions.push("ciudad = @ciudad");
            request.input("ciudad", ciudad.trim());
        }

        if (empresa && typeof empresa === 'string' && empresa.trim()) {
            conditions.push("empresa = @empresa");
            request.input("empresa", empresa.trim());
        }
        if (nom_gru && typeof nom_gru === 'string' && nom_gru.trim()) {
            conditions.push("NOM_GRU = @NOM_GRU");
            request.input("NOM_GRU", nom_gru.trim());
        }

        if (conditions.length > 0) {
            whereConditions = 'WHERE ' + conditions.join(' AND ');
        }

        // Consulta principal con paginación
        const query = `
            SELECT * FROM V_INV_BIN007_POWER_BI_TOTAL 
            ${whereConditions}
            ORDER BY ciudad
            OFFSET ${offset} ROWS 
            FETCH NEXT ${limit} ROWS ONLY
        `;

        // Consulta para contar total de registros
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM V_INV_BIN007_POWER_BI_TOTAL 
            ${whereConditions}
        `;

        // Consulta para obtener totales/sumas de los campos numéricos importantes
        const summaryQuery = `
            SELECT 
                SUM(CAST(EXISTENCIA AS DECIMAL(18,2))) as total_existencia,
                SUM(CAST(VALOR AS DECIMAL(18,2))) as total_valor,
                AVG(CAST(DiasUC AS DECIMAL(18,2))) as promedio_dias_ultima_compra,
                COUNT(DISTINCT ciudad) as total_ciudades,
                COUNT(DISTINCT empresa) as total_empresas,
                COUNT(DISTINCT COD_ITEM) as total_items_unicos,
                COUNT(DISTINCT NOM_GRU) as total_grupos,
                COUNT(DISTINCT DES_MAR) as total_marcas
            FROM V_INV_BIN007_POWER_BI_TOTAL 
            ${whereConditions}
        `;

        // Crear request para la consulta de conteo con los mismos parámetros
        const countRequest = pool.request();
        if (ciudad && typeof ciudad === 'string' && ciudad.trim()) {
            countRequest.input("ciudad", ciudad.trim());
        }
        if (empresa && typeof empresa === 'string' && empresa.trim()) {
            countRequest.input("empresa", empresa.trim());
        }
        if (nom_gru && typeof nom_gru === 'string' && nom_gru.trim()) {
            countRequest.input("NOM_GRU", nom_gru.trim());
        }

        // Crear request para la consulta de totales con los mismos parámetros
        const summaryRequest = pool.request();
        if (ciudad && typeof ciudad === 'string' && ciudad.trim()) {
            summaryRequest.input("ciudad", ciudad.trim());
        }
        if (empresa && typeof empresa === 'string' && empresa.trim()) {
            summaryRequest.input("empresa", empresa.trim());
        }
        if (nom_gru && typeof nom_gru === 'string' && nom_gru.trim()) {
            summaryRequest.input("NOM_GRU", nom_gru.trim());
        }

        // Ejecutar consultas en paralelo para mejor rendimiento
        const [result, totalResult, summaryResult] = await Promise.all([
            request.query(query),
            countRequest.query(countQuery),
            summaryRequest.query(summaryQuery)
        ]);

        const data = result.recordset;
        const total = totalResult.recordset[0].total;
        const summary = summaryResult.recordset[0];
        const totalPages = Math.ceil(total / limit);

        // Construir enlaces de paginación
        const { next, prev } = buildPaginationLinks(req, page, limit, total);

        // Respuesta exitosa con metadata
        return res.status(200).json({
            success: true,
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
            next,
            prev,
            data,
            summary: {
                total_existencia: summary.total_existencia || 0,
                total_valor: summary.total_valor || 0,
                promedio_dias_ultima_compra: Math.round(summary.promedio_dias_ultima_compra || 0),
                total_ciudades: summary.total_ciudades || 0,
                total_empresas: summary.total_empresas || 0,
                total_items_unicos: summary.total_items_unicos || 0,
                total_grupos: summary.total_grupos || 0,
                total_marcas: summary.total_marcas || 0
            },
            filters: {
                ciudad: ciudad || null,
                empresa: empresa || null,
                nom_gru: nom_gru || null
            }
        });

    } catch (error: any) {
        // Manejo específico de errores de base de datos
        if (error?.message?.includes('Connection')) {
            throw new AppError('Error de conexión a la base de datos', 503, {
                detail: 'Por favor intente nuevamente en unos momentos'
            });
        }

        if (error?.message?.includes('timeout')) {
            throw new AppError('Tiempo de espera agotado', 504, {
                detail: 'La consulta tardó demasiado tiempo, intente con un límite menor'
            });
        }

        throw new AppError('Error al obtener el inventario', 500, {
            detail: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Error interno del servidor'
        });
    }
};

// inventario agrupado por marcas
export const getInventoryByBrand = async (req: Request, res: Response) => {

    try {

        const pool = await getPool();

        /* SELECT 
    des_mar,
    SUM(existencia) AS CUNTA,
    SUM(CAST(VALOR AS DECIMAL(18,2))) AS Valor_por_marca
FROM V_INV_BIN007_POWER_BI_TOTAL
GROUP BY des_mar
ORDER BY Valor_por_marca DESC; */

        const sql = `
        SELECT 
            des_mar AS marca,
            SUM(existencia) AS cantidad_total,
            SUM(CAST(VALOR AS DECIMAL(18,2))) AS valor_total
        FROM V_INV_BIN007_POWER_BI_TOTAL
        GROUP BY des_mar
        ORDER BY valor_total DESC;
        `;

        const result = await pool.request().query(sql);
        return res.status(200).json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error("Error en getInventoryByBrand:", error);
        throw new AppError("Error al obtener el inventario por marca", 500, {
            detail: process.env.NODE_ENV === "development" ? (error as Error).message : "Error interno del servidor",
        });
    }
}