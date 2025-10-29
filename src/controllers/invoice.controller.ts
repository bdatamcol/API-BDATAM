// controllers/facturacion.controller.ts
import { Request, Response } from "express";
const sql = require('mssql');
import { getPool } from "../data";
import { AppError } from "../middlewares/error.middleware";
import { buildPaginationLinks } from "../utils";

const VIEW = "V_INV_BVEN020_POWER_BI_TOTAL";
const withDateFormat = (q: string) => `SET DATEFORMAT dmy; ${q}`;

// columnas candidatas que sí existen típicamente en V_INV_BVEN020_POWER_BI_TOTAL (según tu Excel)
const ORDER_CANDIDATES = ["tip_doc", "num_doc", "ven_net", "mon_iva", "valor", "cantidad", "tienda", "nom_ven", "des_mar", "nom_gru"];
const DATE_CANDIDATES = ["fecha", "fec_doc", "fecha_doc", "fch_doc", "fecha_emision"]; // ajustado a esta vista

async function getColumns(pool: any) {
    const r = await pool.request()
        .input("v", sql.NVarChar, VIEW)
        .query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = @v
    `);
    return new Set<string>(r.recordset.map((x: any) => x.COLUMN_NAME.toLowerCase()));
}

function firstExisting(cols: Set<string>, candidates: string[]) {
    return candidates.find(c => cols.has(c.toLowerCase()));
}

export const getInvoice = async (req: Request, res: Response) => {
    try {
        const { page: p, limit: l, orderBy } = req.query;
        const page = Math.max(1, parseInt((p as string) || "1", 10));
        const limit = Math.min(Math.max(1, parseInt((l as string) || "100", 10)), 1000);
        const offset = (page - 1) * limit;

        const pool = await getPool();
        const cols = await getColumns(pool);

        // columna de fecha real en ESTA vista
        const dateCol = firstExisting(cols, DATE_CANDIDATES);
        if (!dateCol) {
            throw new AppError(
                "La vista no expone una columna de fecha conocida",
                400,
                { detail: `Esperaba una de: ${DATE_CANDIDATES.join(", ")}` }
            );
        }

        // TIPO existe en tu Excel; si no existiera, quitamos ese filtro
        const hasTIPO = cols.has("tipo");
        const tipoWhere = hasTIPO ? "TIPO = @tipo" : null;

        // filtro por año 2025 usando la fecha real
        const yearWhere = `YEAR(TRY_CONVERT(date, [${dateCol}], 103)) = @year`;
        console.log(yearWhere);

        const whereClause = "WHERE " + [tipoWhere, yearWhere].filter(Boolean).join(" AND ");

        // ORDER BY solo con columnas que existen aquí
        const allowedOrder = ORDER_CANDIDATES.filter(c => cols.has(c));
        const defaultOrder = (allowedOrder.includes("tip_doc") && allowedOrder.includes("num_doc"))
            ? "tip_doc, num_doc"
            : (allowedOrder[0] || "1"); // "1" => orden trivial si faltara todo (no debería)
        const safeOrderBy =
            typeof orderBy === "string" &&
                orderBy.split(",").map(s => s.trim().toLowerCase()).every(c => cols.has(c))
                ? (orderBy as string)
                : defaultOrder;

        // SQLs
        const dataSql = withDateFormat(`
      SELECT *
      FROM ${VIEW}
      ${whereClause}
      ORDER BY ${safeOrderBy}
      OFFSET ${offset} ROWS
      FETCH NEXT ${limit} ROWS ONLY;
    `);

        const countSql = withDateFormat(`
      SELECT COUNT(*) AS total
      FROM ${VIEW}
      ${whereClause};
    `);

        const sumSql = withDateFormat(`
      SELECT
        SUM(CAST(cantidad AS DECIMAL(38,6)))                                AS total_cantidad,
        SUM(CAST(ven_net  AS DECIMAL(38,6)))                                AS total_venta_neta,
        SUM(CAST(mon_iva  AS DECIMAL(38,6)))                                AS total_monto_iva,
        SUM(CAST(val_def  AS DECIMAL(38,6)))                                AS total_descuento,
        SUM(CAST(valor    AS DECIMAL(38,6)))                                AS total_valor,
        SUM(CAST(COALESCE(ven_net,0)+COALESCE(mon_iva,0) AS DECIMAL(38,6))) AS total_con_iva
      FROM ${VIEW}
      ${whereClause};
    `);

        // bind de parámetros (¡nombres idénticos a la SQL!)
        const bind = (r: any) => {
            if (hasTIPO) r.input("tipo", sql.NVarChar, "FACTURA");
            r.input("year", sql.Int, 2025);
        };
        const dataReq = pool.request(); bind(dataReq);
        const countReq = pool.request(); bind(countReq);
        const sumReq = pool.request(); bind(sumReq);

        const [dataRs, countRs, sumRs] = await Promise.all([
            dataReq.query(dataSql),
            countReq.query(countSql),
            sumReq.query(sumSql),
        ]);

        const data = dataRs.recordset || [];
        const total = (countRs.recordset?.[0]?.total as number) ?? 0;
        const s = sumRs.recordset?.[0] || {};
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const { next, prev } = buildPaginationLinks(req, page, limit, total);

        return res.status(200).json({
            success: true,
            notice: `Filtro: ${(hasTIPO ? "TIPO='FACTURA', " : "")}YEAR(${dateCol})=2025 - vista ${VIEW}`,
            page, limit, total, totalPages,
            hasNext: page < totalPages, hasPrev: page > 1,
            next, prev, orderBy: safeOrderBy,
            summary: {
                total_cantidad: Number(s?.total_cantidad || 0),
                total_venta_neta: Number(s?.total_venta_neta || 0),
                total_monto_iva: Number(s?.total_monto_iva || 0),
                total_descuento: Number(s?.total_descuento || 0),
                total_valor: Number(s?.total_valor || 0),
                total_con_iva: Number(s?.total_con_iva || 0),
            },
            data,
        });
    } catch (error: any) {
        console.error("Error en getInvoice:", error);
        if (error?.number === 153 && /FETCH\s+NEXT/i.test(error?.message || "")) {
            // Suele ser porque la SQL quedó inválida por un parámetro faltante o ORDER BY inválido
            return res.status(400).json({
                success: false,
                message: "La consulta quedó inválida para paginar (OFFSET/FETCH).",
                hint: "Revisa que los parámetros enlazados coincidan con los del WHERE y que las columnas del ORDER BY existan en la vista.",
                error: process.env.NODE_ENV === "development" ? error.message : undefined,
            });
        }
        if (error?.number === 242 || /date/.test((error?.message || "").toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: "Error al convertir fechas",
                detail: "Se fuerza DATEFORMAT dmy; si persiste, hay filas con formato inválido.",
            });
        }
        throw new AppError("Error al obtener las ventas", 500, {
            detail: process.env.NODE_ENV === "development" ? error.message : "Error interno del servidor",
        });
    }
};