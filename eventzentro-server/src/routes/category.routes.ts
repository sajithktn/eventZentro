import { Router } from "express";
import { getActiveCategories } from "../controllers/category.controller";

const router = Router();

router.get("/", getActiveCategories);

export default router;