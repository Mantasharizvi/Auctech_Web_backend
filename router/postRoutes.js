import Post from "../models/Post.modal.js";
import { makeCrudRouter } from "./crudRouter.js";

export default makeCrudRouter(Post, ["title", "subtitle"]);
