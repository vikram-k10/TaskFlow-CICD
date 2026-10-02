import express from "express";
import { getTasks, getTask, createTask, updateTask, deleteTask } from "../controllers/taskController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", getTasks);
router.post("/", createTask);
router.get("/:id", getTask);
// The workspace owner may edit everything; an assignee may change only the status (checked in the controller)
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;
