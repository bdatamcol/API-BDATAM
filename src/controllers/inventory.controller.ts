import { Request, Response } from "express";
import { getPool } from "../data";

export const getInventory = async (req: Request, res: Response) => {
    const { ciudad, empresa } = req.query;
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "100", 10);

    const offset = (page - 1) * limit;

    const pool = await getPool();

    try {
        // Consulta principal con filtros, paginación
        let query = `
      SELECT *
      FROM V_INV_BIN007_POWER_BI_TOTAL
      WHERE 1=1
    `;

        const request = pool.request();

        if (ciudad) {
            query += " AND ciudad = @ciudad";
            request.input("ciudad", ciudad as string);
        }
        if (empresa) {
            query += " AND empresa = @empresa";
            request.input("empresa", empresa as string);
        }

        // Agregamos paginación usando OFFSET / FETCH
        query += `
      ORDER BY ciudad
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;
        request.input("offset", offset);
        request.input("limit", limit);

        // Consulta para contar total de registros con los mismos filtros
        let countQuery = `
      SELECT COUNT(*) as total
      FROM V_INV_BIN007_POWER_BI_TOTAL
      WHERE 1=1
    `;
        const countRequest = pool.request();

        if (ciudad) {
            countQuery += " AND ciudad = @ciudad";
            countRequest.input("ciudad", ciudad as string);
        }
        if (empresa) {
            countQuery += " AND empresa = @empresa";
            countRequest.input("empresa", empresa as string);
        }

        const [result, totalResult] = await Promise.all([
            request.query(query),
            countRequest.query(countQuery),
        ]);

        const total = totalResult.recordset[0].total;

        //  reconstruimos los parámetros de query dinámicamente
        const queryParams = new URLSearchParams({
            ...Object.fromEntries(Object.entries(req.query).filter(([key]) => key !== "page" && key !== "limit")),
            limit: limit.toString(),
        });
        
        const baseUrl = `${req.protocol}://${req.get("host")}${req.baseUrl}${req.path}`;

        const next =
            limit * page >= total
                ? null
                : `${baseUrl}?${queryParams.toString()}&page=${page + 1}`;

        const prev =
            page - 1 <= 0
                ? null
                : `${baseUrl}?${queryParams.toString()}&page=${page - 1}`;

        res.json({
            page,
            limit,
            total,
            next,
            prev,
            data: result.recordset,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error consultando inventario");
    }
};