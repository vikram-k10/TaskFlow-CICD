import express from "express";
import {
  createWorkspace,
  getMyWorkspaces,
  getWorkspace,
  addMember,
  removeMember,
} from "../controllers/workspaceController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.post("/", createWorkspace);
router.get("/", getMyWorkspaces);
router.get("/:id", getWorkspace);
router.post("/:id/members", addMember);
router.delete("/:id/members/:userId", removeMember);

export default router;
