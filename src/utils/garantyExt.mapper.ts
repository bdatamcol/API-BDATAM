import { TipoCliente, GarantyExtRow } from "../controllers/garanty-ext.controller";

export interface GarantyExtRawRow {
    empresa: string;
    vendedor: string;
    nom_ven: string;
    item: string;
    des_item: string;
    cod_mar: string;
    des_mar: string;
    cod_grupo: string;
    nom_gru: string;
    cod_subgrupo: string;
    nom_sub: string;
    cod_suc: string;
    nom_suc: string;
    cod_cco: string;
    nom_cco: string;
    fecha: string;
    hora: string;
    tip_doc: string;
    num_doc: string;
    cantidad: number;
    ven_net: number;
    mon_iva: number;
    val_def: number;
    FormaPago: string;
    cod_bod: string;
    nom_bod: string;
    valor: number;
    tipo_cliente: string;
    cedula: string;
    nombre: string;
    direccion: string;
    telefono: string;
}

export const trimValue = (v: unknown) =>
    typeof v === "string" ? v.trim() : v;

export function mapGarantyRow(row: GarantyExtRawRow): GarantyExtRow {
    return {
        empresa: trimValue(row.empresa) as string,

        vendedorCodigo: trimValue(row.vendedor) as string,
        vendedorNombre: trimValue(row.nom_ven) as string,

        itemCodigo: trimValue(row.item) as string,
        itemDescripcion: trimValue(row.des_item) as string,

        marcaCodigo: trimValue(row.cod_mar) as string,
        marcaDescripcion: trimValue(row.des_mar) as string,

        grupoCodigo: trimValue(row.cod_grupo) as string,
        grupoNombre: trimValue(row.nom_gru) as string,

        subgrupoCodigo: trimValue(row.cod_subgrupo) as string,
        subgrupoNombre: trimValue(row.nom_sub) as string,

        sucursalCodigo: trimValue(row.cod_suc) as string,
        sucursalNombre: trimValue(row.nom_suc) as string,

        centroCostoCodigo: trimValue(row.cod_cco) as string,
        centroCostoNombre: trimValue(row.nom_cco) as string,

        fecha: row.fecha,
        hora: trimValue(row.hora) as string,
        tipoDocumento: trimValue(row.tip_doc) as string,
        numeroDocumento: trimValue(row.num_doc) as string,

        cantidad: row.cantidad,
        ventaNeta: row.ven_net,
        montoIva: row.mon_iva,
        valorDefinitivo: row.val_def,

        formaPago: trimValue(row.FormaPago) as string,

        bodegaCodigo: trimValue(row.cod_bod) as string,
        bodegaNombre: trimValue(row.nom_bod) as string,

        costoProducto: row.valor,

        tipoCliente: trimValue(row.tipo_cliente) as TipoCliente,
        cedula: trimValue(row.cedula) as string,
        clienteNombre: trimValue(row.nombre) as string,
        clienteDireccion: trimValue(row.direccion) as string,
        clienteTelefono: trimValue(row.telefono) as string,
    };
}
