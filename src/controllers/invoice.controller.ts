import { Request, Response } from "express";
import { buildPaginationLinks } from "../utils";
import { AppError } from "../middlewares/error.middleware";
import { getPool } from "../data";

export const getInvoice = async (req: Request, res: Response) => {

    try {

        const {
            tienda,
            ano_doc,
            cod_mar,
            cod_grupo,
            cod_subgrupo,
            page: pageQuery,
            limit: limitQuery
        } = req.query;

        // Parámetros de paginación con valores por defecto seguros
        const page = Math.max(1, parseInt((pageQuery as string) || "1", 10));
        const limit = Math.min(Math.max(1, parseInt((limitQuery as string) || "100", 10)), 1000); // Máximo 1000 registros
        const offset = (page - 1) * limit;

        const pool = await getPool();

        // Construir consulta SQL con filtros seguros
        const conditions: string[] = [];
        const request = pool.request();

        // FILTRO OBLIGATORIO POR AÑO - usar año actual por defecto
        const currentYear = new Date().getFullYear().toString();
        const yearFilter = (ano_doc && typeof ano_doc === 'string' && ano_doc.trim()) 
            ? ano_doc.trim() 
            : currentYear;
        
        conditions.push("ANO_DOC = @ano_doc");
        request.input("ano_doc", yearFilter);

        // Agregar filtros adicionales de manera segura usando parámetros
        if (tienda && typeof tienda === 'string' && tienda.trim()) {
            conditions.push("tienda = @tienda");
            request.input("tienda", tienda.trim());
        }

        if (cod_mar && typeof cod_mar === 'string' && cod_mar.trim()) {
            conditions.push("cod_mar = @cod_mar");
            request.input("cod_mar", cod_mar.trim());
        }

        if (cod_grupo && typeof cod_grupo === 'string' && cod_grupo.trim()) {
            conditions.push("cod_grupo = @cod_grupo");
            request.input("cod_grupo", cod_grupo.trim());
        }

        if (cod_subgrupo && typeof cod_subgrupo === 'string' && cod_subgrupo.trim()) {
            conditions.push("cod_subgrupo = @cod_subgrupo");
            request.input("cod_subgrupo", cod_subgrupo.trim());
        }

        // Siempre habrá condiciones porque el año es obligatorio
        const whereConditions = 'WHERE ' + conditions.join(' AND ');

        // Consulta principal con paginación
        const query = `
            SELECT * FROM V_INV_BVEN020_POWER_BI_TOTAL_DEV2_CUE 
            ${whereConditions}
            ORDER BY ID
            OFFSET ${offset} ROWS 
            FETCH NEXT ${limit} ROWS ONLY
        `;

        // Consulta para contar total de registros
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM V_INV_BVEN020_POWER_BI_TOTAL_DEV2_CUE 
            ${whereConditions}
        `;

        // Consulta para obtener totales/sumas de los campos numéricos
        const summaryQuery = `
            SELECT 
                SUM(CAST(cantidad AS DECIMAL(18,2))) as total_cantidad,
                SUM(CAST(venta AS DECIMAL(18,2))) as total_venta,
                SUM(CAST(venta_descuento AS DECIMAL(18,2))) as total_venta_descuento,
                SUM(CAST(monto_iva AS DECIMAL(18,2))) as total_monto_iva,
                SUM(CAST(monto_descuento AS DECIMAL(18,2))) as total_monto_descuento,
                SUM(CAST(total AS DECIMAL(18,2))) as total_general
            FROM V_INV_BVEN020_POWER_BI_TOTAL_DEV2_CUE 
            ${whereConditions}
        `;

        // Crear request para la consulta de conteo con los mismos parámetros
        const countRequest = pool.request();

        // Agregar el filtro de año obligatorio al request de conteo
        countRequest.input("ano_doc", yearFilter);

        if (tienda && typeof tienda === 'string' && tienda.trim()) {
            countRequest.input("tienda", tienda.trim());
        }
        if (cod_mar && typeof cod_mar === 'string' && cod_mar.trim()) {
            countRequest.input("cod_mar", cod_mar.trim());
        }
        if (cod_grupo && typeof cod_grupo === 'string' && cod_grupo.trim()) {
            countRequest.input("cod_grupo", cod_grupo.trim());
        }
        if (cod_subgrupo && typeof cod_subgrupo === 'string' && cod_subgrupo.trim()) {
            countRequest.input("cod_subgrupo", cod_subgrupo.trim());
        }

        // Crear request para la consulta de totales con los mismos parámetros
        const summaryRequest = pool.request();

        // Agregar el filtro de año obligatorio al request de totales
        summaryRequest.input("ano_doc", yearFilter);

        if (tienda && typeof tienda === 'string' && tienda.trim()) {
            summaryRequest.input("tienda", tienda.trim());
        }
        if (cod_mar && typeof cod_mar === 'string' && cod_mar.trim()) {
            summaryRequest.input("cod_mar", cod_mar.trim());
        }
        if (cod_grupo && typeof cod_grupo === 'string' && cod_grupo.trim()) {
            summaryRequest.input("cod_grupo", cod_grupo.trim());
        }
        if (cod_subgrupo && typeof cod_subgrupo === 'string' && cod_subgrupo.trim()) {
            summaryRequest.input("cod_subgrupo", cod_subgrupo.trim());
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
                total_cantidad: summary.total_cantidad || 0,
                total_venta: summary.total_venta || 0,
                total_venta_descuento: summary.total_venta_descuento || 0,
                total_monto_iva: summary.total_monto_iva || 0,
                total_monto_descuento: summary.total_monto_descuento || 0,
                total_general: summary.total_general || 0
            },
            filters: {
                tienda: tienda || null,
                ano_doc: yearFilter, // Mostrar el año que se está usando (actual o especificado)
                cod_mar: cod_mar || null,
                cod_grupo: cod_grupo || null,
                cod_subgrupo: cod_subgrupo || null
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

        throw new AppError('Error al obtener las ventas', 500, {
            detail: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Error interno del servidor'
        });
    }

}