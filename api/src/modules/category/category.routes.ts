import { Router } from "express";
import { getActiveCategories } from "./category.controller";

const router = Router();

router.get("/", getActiveCategories);

export default router;