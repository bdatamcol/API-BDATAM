import { Router } from "express";
import { JapolandiaListController } from "../controllers/japolandia-list.controller";


export class JapolandiaListRoutes {
    static get routes() {
        const router = Router();
        router.get("/list-motos", JapolandiaListController.getJapolandiaList);
        return router;
    }
}