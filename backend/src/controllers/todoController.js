import Todo from "../models/Todo.js";

const parseDueDateInput = (value) => {
  if (!value) return null;

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate(), 12, 0, 0, 0));
};

const isPastDate = (date) => {
  if (!date) return false;

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  const target = new Date(date);
  const targetKey = `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, "0")}-${String(
    target.getUTCDate()
  ).padStart(2, "0")}`;

  return targetKey < todayKey;
};

export const createTodo = async (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    const parsedDueDate = parseDueDateInput(dueDate);
    if (dueDate && !parsedDueDate) {
      return res.status(400).json({ message: "Invalid due date" });
    }
    if (parsedDueDate && isPastDate(parsedDueDate)) {
      return res.status(400).json({ message: "Due date cannot be in the past" });
    }

    const todo = await Todo.create({
      title: title.trim(),
      description: description?.trim() || "",
      priority: priority || "Medium",
      dueDate: parsedDueDate || null,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: todo,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTodos = async (req, res) => {
  try {
    const todos = await Todo.find({ createdBy: req.user._id }).sort({
      isCompleted: 1,
      createdAt: -1,
    });

    res.json({
      success: true,
      data: todos,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    const allowedFields = ["title", "description", "priority", "dueDate", "isCompleted"];

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        if (field === "title") {
          const safeTitle = String(req.body.title || "").trim();
          if (!safeTitle) {
            return res.status(400).json({ message: "Title is required" });
          }
          updates.title = safeTitle;
          continue;
        }

        if (field === "description") {
          updates.description = String(req.body.description || "").trim();
          continue;
        }

        if (field === "dueDate") {
          if (!req.body.dueDate) {
            updates.dueDate = null;
            continue;
          }
          const parsedDueDate = parseDueDateInput(req.body.dueDate);
          if (!parsedDueDate) {
            return res.status(400).json({ message: "Invalid due date" });
          }
          if (isPastDate(parsedDueDate)) {
            return res.status(400).json({ message: "Due date cannot be in the past" });
          }
          updates.dueDate = parsedDueDate;
          continue;
        }

        updates[field] = req.body[field];
      }
    }

    const todo = await Todo.findOneAndUpdate(
      { _id: id, createdBy: req.user._id },
      updates,
      { returnDocument: "after", runValidators: true }
    );

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.json({
      success: true,
      data: todo,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleTodoStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const todo = await Todo.findOne({ _id: id, createdBy: req.user._id });

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    todo.isCompleted = !todo.isCompleted;
    await todo.save();

    res.json({
      success: true,
      data: todo,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const todo = await Todo.findOneAndDelete({ _id: id, createdBy: req.user._id });

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.json({
      success: true,
      message: "Todo deleted",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
