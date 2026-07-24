import { Router } from "express";

import {
  blockAdminUser,
  changeAdminUserRole,
  deleteAdminUser,
  getAdminDashboard,
  getAdminOrganizers,
  getAdminUserDetails,
  getAdminUsers,
  restoreAdminUser,
  unblockAdminUser,
  verifyAdminUser,
} from "../controllers/admin.controller";
import {
  protect,
} from "../middleware/auth.middleware";
import {
  adminOnly,
} from "../middleware/role.middleware";

const router = Router();

router.use(protect, adminOnly);

router.get(
  "/dashboard",
  getAdminDashboard
);

router.get(
  "/users",
  getAdminUsers
);

router.get(
  "/organizers",
  getAdminOrganizers
);

router.get(
  "/users/:userId",
  getAdminUserDetails
);

router.patch(
  "/users/:userId/block",
  blockAdminUser
);

router.patch(
  "/users/:userId/unblock",
  unblockAdminUser
);

router.patch(
  "/users/:userId/verify",
  verifyAdminUser
);

router.patch(
  "/users/:userId/role",
  changeAdminUserRole
);

router.delete(
  "/users/:userId",
  deleteAdminUser
);

router.patch(
  "/users/:userId/restore",
  restoreAdminUser
);

export default router;