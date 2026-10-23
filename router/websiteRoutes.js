import Website from "../models/Website.modal.js";
import { makeCrudRouter } from "./crudRouter.js";

export default makeCrudRouter(Website, ["name", "domain", "description", "category"]);
