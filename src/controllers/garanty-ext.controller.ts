import { Request, Response } from "express";
import { executeQuery } from "../data";
import { mapGarantyRow, GarantyExtRawRow, buildPaginationLinks } from "../utils";

export type TipoCliente = "CLIENTE NUEVO" | "CLIENTE ANTIGUO" | string;

// Estructura limpia que verá el frontend
export interface GarantyExtRow {
    empresa: string;

    vendedorCodigo: string;
    vendedorNombre: string;

    itemCodigo: string;
    itemDescripcion: string;

    marcaCodigo: string;
    marcaDescripcion: string;

    grupoCodigo: string;
    grupoNombre: string;

    subgrupoCodigo: string;
    subgrupoNombre: string;

    sucursalCodigo: string;
    sucursalNombre: string;

    centroCostoCodigo: string;
    centroCostoNombre: string;

    fecha: string;          // ISO
    hora: string;           // "HH:mm"
    tipoDocumento: string;
    numeroDocumento: string;

    cantidad: number;
    ventaNeta: number;
    montoIva: number;
    valorDefinitivo: number;

    formaPago: string;

    bodegaCodigo: string;
    bodegaNombre: string;

    costoProducto: number;

    tipoCliente: TipoCliente;
    cedula: string;
    clienteNombre: string;
    clienteDireccion: string;
    clienteTelefono: string;
}

export class GarantyExtController {
    static async getGarantyExtList(req: Request, res: Response) {
        try {
            const { year: yearParam, page: pageParam = 1, limit: limitParam = 100 } = req.query;

            const year = Number(yearParam);
            const page = Number(pageParam);
            const limit = Number(limitParam);
            const offset = (page - 1) * limit;

            if (!yearParam || Number.isNaN(year)) {
                return res.status(400).json({
                    success: false,
                    message: "Debe enviar el parámetro year numérico. Ejemplo: /garanty-list?year=2025",
                });
            }

            const baseQuery = `
                FROM dbo.inv_cabdoc cab WITH (NOLOCK)
                INNER JOIN dbo.inv_cuedoc cue WITH (NOLOCK)
                    ON cab.ano_doc = cue.ano_doc
                    AND cab.per_doc = cue.per_doc
                    AND cab.tip_doc = cue.tip_doc
                    AND cab.num_doc = cue.num_doc
                INNER JOIN dbo.inv_bodegas bod WITH (NOLOCK)
                    ON bod.cod_bod = cue.bodega
                INNER JOIN dbo.gen_vendedor ven WITH (NOLOCK)
                    ON cab.vendedor = ven.cod_ven
                INNER JOIN dbo.inv_items ite WITH (NOLOCK)
                    ON cue.item = ite.cod_item
                INNER JOIN dbo.inv_marca mar WITH (NOLOCK)
                    ON ite.cod_mar = mar.cod_mar
                INNER JOIN dbo.inv_grupos gru WITH (NOLOCK)
                    ON ite.cod_grupo = gru.cod_gru
                INNER JOIN dbo.inv_subgrupos sub WITH (NOLOCK)
                    ON ite.cod_grupo = sub.cod_gru
                    AND ite.cod_subgrupo = sub.cod_sub
                INNER JOIN dbo.gen_sucursal suc WITH (NOLOCK)
                    ON cab.cod_suc = suc.cod_suc
                INNER JOIN dbo.gen_ccosto cco WITH (NOLOCK)
                    ON cco.cod_cco = cab.cod_cco
                INNER JOIN (
                        SELECT 
                            cab.cliente,
                            cli.nit_cli AS cedula,
                            cli.nom_cli AS nombre,
                            cli.di1_cli AS direccion,
                            cli.te1_cli AS telefono,
                            CASE WHEN COUNT(1) > 1 THEN 'CLIENTE ANTIGUO'
                                 ELSE 'CLIENTE NUEVO'
                            END AS tipo_cliente
                        FROM dbo.inv_cabdoc cab WITH (NOLOCK)
                        INNER JOIN dbo.cxc_cliente cli
                            ON cli.cod_cli = cab.cliente
                        WHERE cab.tip_doc IN ('010','510','302')
                        GROUP BY cab.cliente, cli.nit_cli, cli.nom_cli, cli.di1_cli, cli.te1_cli
                ) temp ON temp.cliente = cab.cliente
                WHERE
                    cab.tip_doc IN ('510','302','010')
                    AND cue.cantidad > 0
                    AND cue.ven_net > 0
                    AND sub.nom_sub NOT IN ('PUBLICIDAD Y MERCADEO')
                    AND cab.num_doc NOT LIKE '%<%'
                    AND temp.cedula <> '901634743'
                    AND mar.des_mar = 'ZURICH'
                    AND YEAR(cab.fecha) = @param0
            `;

            const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;

            const dataQuery = `
                SELECT
                    'CBB' AS empresa,
                    cab.vendedor,
                    ven.nom_ven,
                    cue.item,
                    ite.des_item,
                    ite.cod_mar,
                    mar.des_mar,
                    ite.cod_grupo,
                    gru.nom_gru,
                    ite.cod_subgrupo,
                    sub.nom_sub,
                    cab.cod_suc,
                    suc.nom_suc,
                    cab.cod_cco,
                    cco.nom_cco,
                    cab.fecha,
                    cab.hora,
                    cab.tip_doc,
                    cab.num_doc,
                    cue.cantidad,
                    cue.ven_net,
                    cue.mon_iva,
                    cue.val_def,
                    CASE 
                        WHEN EXISTS (SELECT 1 FROM ptv_detcuadre_caja WHERE num_doc = cab.num_doc AND for_pag IN ('13','41'))
                            THEN 'CREDITO H.P.H'
                        WHEN EXISTS (SELECT 1 FROM ptv_detcuadre_caja WHERE num_doc = cab.num_doc AND for_pag = '37')
                            THEN 'CLIENTES MAYOREO'
                        WHEN EXISTS (SELECT 1 FROM ptv_detcuadre_caja WHERE num_doc = cab.num_doc AND for_pag = '15')
                            THEN 'CLIENTE INSTITUCIONAL'
                        WHEN EXISTS (SELECT 1 FROM ptv_detcuadre_caja WHERE num_doc = cab.num_doc AND for_pag = '30')
                            THEN 'CREDIORBE'
                        WHEN EXISTS (SELECT 1 FROM ptv_detcuadre_caja WHERE num_doc = cab.num_doc AND for_pag = '39')
                            THEN 'SUFI BANCOLOMBIA'
                        ELSE 'CONTADO'
                    END AS FormaPago,
                    bod.cod_bod,
                    bod.nom_bod,
                    ite.cos_pro AS valor,
                    temp.tipo_cliente,
                    temp.cedula,
                    temp.nombre,
                    temp.direccion,
                    temp.telefono
                ${baseQuery}
                ORDER BY cab.fecha DESC
                OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY;
            `;

            // Ejecutar consultas en paralelo
            const [countResult, dataResult] = await Promise.all([
                executeQuery(countQuery, [year], "CBBSAS"),
                executeQuery(dataQuery, [year], "CBBSAS")
            ]);

            const total = countResult.recordset[0].total;
            const rawRows: GarantyExtRawRow[] = dataResult.recordset || [];
            const data: GarantyExtRow[] = rawRows.map(mapGarantyRow);
            
            const totalPages = Math.ceil(total / limit);
            const { next, prev } = buildPaginationLinks(req, page, limit, total);

            return res.json({
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
            });
        } catch (error) {
            console.error("Error al obtener la lista de garantías extendidas:", error);
            return res.status(500).json({
                success: false,
                error: "Error al obtener la lista de garantías extendidas",
            });
        }
    }
}