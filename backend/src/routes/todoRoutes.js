import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createTodo,
  deleteTodo,
  getTodos,
  toggleTodoStatus,
  updateTodo,
} from "../controllers/todoController.js";

const router = express.Router();

router.use(authMiddleware);

router.route("/").get(getTodos).post(createTodo);
router.patch("/:id/toggle", toggleTodoStatus);
router.route("/:id").put(updateTodo).delete(deleteTodo);

export default router;
