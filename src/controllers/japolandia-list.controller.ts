import { Request, Response } from "express";
import { executeQuery, getPool } from "../data";


export class JapolandiaListController {

    static async getJapolandiaList(req: Request, res: Response) {

        try {

            const { page: pageQuery, limit: limitQuery } = req.query;

            // Parámetros de paginación con valores por defecto seguros
            const page = Math.max(1, parseInt((pageQuery as string) || "1", 10));
            const limit = Math.min(Math.max(1, parseInt((limitQuery as string) || "1000", 10)), 1000); // Máximo 1000 registros
            const offset = (page - 1) * limit;

            const query = `
                    SELECT
                        t1.cod_item,
                        t1.des_item,
                        t2.ttun12 as existencia,
                        t1.por_iva,
                        t3.pre_vta,
                        t3.cod_lis,
                        (t3.pre_vta * (ISNULL(t1.por_iva, 0) / 100.0)) AS valor_iva,
                        (t3.pre_vta * (1 + (ISNULL(t1.por_iva, 0) / 100.0))) AS precio_final
                    FROM
                        base_0018.dbo.inv_items AS t1
                    INNER JOIN
                        base_0018.dbo.inv_acum AS t2 ON t1.cod_item = t2.cod_item
                    INNER JOIN base_0018.dbo.inv_lispre as t3
                        ON t1.cod_item = t3.cod_item
                    WHERE
                        t2.ano_acu = '2025'
                        AND t2.ttun12 >= 1
                        AND t3.cod_lis IN ('11','29')
                    ORDER BY t1.cod_item
                    OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY;
                `;

                const result = await executeQuery(query, [], 'base_0018');
                return res.json({
                    success: true,
                    page,
                    limit,
                    count: result.recordset?.length || 0,
                    data: result.recordset || []
                });

        } catch (error) {
            console.error("Error al obtener la lista de productos:", error);
            return res.status(500).json({ success: false, error: "Error al obtener la lista de productos" });
        }
    }
}