import { Router } from "express";

import {
  uploadEventImage,
} from "../controllers/upload.controller";
import {
  protect,
} from "../middleware/auth.middleware";
import {
  handleSingleImageUpload,
} from "../middleware/upload.middleware";

const router = Router();

router.post(
  "/event-image",
  protect,
  handleSingleImageUpload,
  uploadEventImage
);

export default router;
