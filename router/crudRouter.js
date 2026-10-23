import { Router } from "express";
import { makeCrud } from "../controllers/crudController.js";
import { verifyJWT, authorizeRoles } from "../middlewares/authTypeMiddleware.js";

export const makeCrudRouter = (Model, searchFields) => {
  const c = makeCrud(Model, searchFields);
  const admin = [verifyJWT, authorizeRoles("Admin")];
  const router = Router();

  router.get("/", c.listPublic);                    // landing page
  router.get("/admin/all", ...admin, c.listAdmin);  // admin panel
  router.post("/", ...admin, c.create);
  router.put("/:id", ...admin, c.update);
  router.delete("/:id", ...admin, c.remove);
  return router;
};
