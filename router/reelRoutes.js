import Reel from "../models/Reel.modal.js";
import { makeCrudRouter } from "./crudRouter.js";

export default makeCrudRouter(Reel, ["title", "subtitle"]);
