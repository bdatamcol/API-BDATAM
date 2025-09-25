import { Request } from "express";

interface PaginationLinks {
    next: string | null;
    prev: string | null;
}

export const buildPaginationLinks = (
    req: Request,
    page: number,
    limit: number,
    total: number
): PaginationLinks => {
    // Convertimos req.query en un Record<string, string>
    const queryParams = new URLSearchParams();

    Object.entries(req.query).forEach(([key, value]) => {
        if (key === "page") return; // no incluimos page
        if (value === undefined) return;

        if (Array.isArray(value)) {
            value.forEach((v) => queryParams.append(key, String(v)));
        } else {
            queryParams.set(key, String(value));
        }
    });

    // aseguramos que limit siempre esté
    queryParams.set("limit", limit.toString());

    const baseUrl = `${req.protocol}://${req.get("host")}${req.baseUrl}${req.path}`;

    const next =
        limit * page >= total
            ? null
            : `${baseUrl}?${queryParams.toString()}&page=${page + 1}`;

    const prev =
        page - 1 <= 0
            ? null
            : `${baseUrl}?${queryParams.toString()}&page=${page - 1}`;

    return { next, prev };
};