import { Router } from "express";

import {
  uploadEventImage,
} from "./upload.controller";
import {
  protect,
} from "../../middlewares/auth.middleware";
import {
  handleSingleImageUpload,
} from "../../middlewares/upload.middleware";

const router = Router();

router.post(
  "/event-image",
  protect,
  handleSingleImageUpload,
  uploadEventImage
);

export default router;
