export interface Inventory {
    success: boolean;
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    next: string;
    prev: null;
    data: Datum[];
    filters: Filters;
}

export interface Datum {
    ciudad: Ciudad;
    ANO_ACU: string;
    COD_ITEM: string;
    DES_ITEM: string;
    COD_GRU: CodGru;
    NOM_GRU: NomGru;
    COD_MAR: string;
    DES_MAR: string;
    NOM_SUB: string;
    DES_MEDIDA: DESMedida;
    NOM_BOD: NomBod;
    COD_BOD: CodBod;
    cod_suc: CodSuc;
    UBI_EST: null;
    EXISTENCIA: number;
    VALOR: number;
    ult_comp: Date;
    fecha_act: Date;
    DiasUC: number;
    empresa: Empresa;
}

export enum CodBod {
    The006 = "006",
    The010 = "010",
    The057 = "057",
    The07 = "07 ",
}

export enum CodGru {
    The006 = "006",
    The010 = "010",
    The012 = "012",
    The013 = "013",
    The015 = "015",
    The017 = "017",
    The02 = "02 ",
}

export enum DESMedida {
    NoAplica = "NO APLICA                     ",
    Und = "UND                           ",
    Unidad = "UNIDAD                        ",
}

export enum NomBod {
    HkaAguachica = "HKA AGUACHICA                           ",
    PrincipalAguachica = "PRINCIPAL AGUACHICA                     ",
    PrinicipalAguachica = "PRINICIPAL AGUACHICA                    ",
    PuntoDVtaAguachica = "PUNTO D VTA AGUACHICA                   ",
}

export enum NomGru {
    Decoracion = "DECORACION                    ",
    LineaBlanca = "LINEA BLANCA                  ",
    LineaMarron = "LINEA MARRON                  ",
    Motocicletas = "MOTOCICLETAS                  ",
    RepuestosGravados = "REPUESTOS GRAVADOS            ",
    TecnologiaExcluida = "TECNOLOGIA EXCLUIDA           ",
    TecnologiaGravada = "TECNOLOGIA GRAVADA            ",
}

export enum Ciudad {
    Aguachica = "AGUACHICA",
}

export enum CodSuc {
    Agh = "AGH",
}

export enum Empresa {
    Cbb = "CBB",
    CieloA = "CIELO A",
    Hka = "HKA",
}

export interface Filters {
    ciudad: null;
    empresa: null;
}
