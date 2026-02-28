import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import styles from "./TodoList.module.css";

const defaultForm = {
  title: "",
  description: "",
  priority: "Medium",
  dueDate: "",
};

const todayDateInput = () => new Date().toISOString().slice(0, 10);

const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [errorText, setErrorText] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState("");
  const [editForm, setEditForm] = useState(defaultForm);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/tools/todos");
      setTodos(data.data || []);
      setErrorText("");
    } catch (error) {
      setErrorText(error.response?.data?.message || "Failed to load todos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const openTodos = useMemo(() => todos.filter((todo) => !todo.isCompleted), [todos]);
  const doneTodos = useMemo(() => todos.filter((todo) => todo.isCompleted), [todos]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      if (!form.title.trim()) {
        setErrorText("Title is required");
        return;
      }

      await API.post("/tools/todos", {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        dueDate: form.dueDate || null,
      });

      setForm(defaultForm);
      await fetchTodos();
    } catch (error) {
      setErrorText(error.response?.data?.message || "Failed to create todo");
    }
  };

  const toggleTodo = async (id) => {
    try {
      await API.patch(`/tools/todos/${id}/toggle`);
      await fetchTodos();
    } catch (error) {
      setErrorText(error.response?.data?.message || "Failed to update todo");
    }
  };

  const deleteTodo = async (id) => {
    try {
      await API.delete(`/tools/todos/${id}`);
      await fetchTodos();
    } catch (error) {
      setErrorText(error.response?.data?.message || "Failed to delete todo");
    }
  };

  const startEdit = (todo) => {
    setEditingTodoId(todo._id);
    setEditForm({
      title: todo.title || "",
      description: todo.description || "",
      priority: todo.priority || "Medium",
      dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().slice(0, 10) : "",
    });
    setErrorText("");
  };

  const cancelEdit = () => {
    setEditingTodoId("");
    setEditForm(defaultForm);
  };

  const handleEditChange = (e) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const saveEdit = async (id) => {
    try {
      if (!editForm.title.trim()) {
        setErrorText("Title is required");
        return;
      }

      await API.put(`/tools/todos/${id}`, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        priority: editForm.priority,
        dueDate: editForm.dueDate || null,
      });

      cancelEdit();
      await fetchTodos();
    } catch (error) {
      setErrorText(error.response?.data?.message || "Failed to update todo");
    }
  };

  const renderTodoItem = (todo) => (
    <li key={todo._id} className={`${styles.todoItem} ${todo.isCompleted ? styles.completed : ""}`}>
      <div className={styles.todoMain}>
        {editingTodoId === todo._id ? (
          <div className={styles.editForm}>
            <input
              type="text"
              name="title"
              value={editForm.title}
              onChange={handleEditChange}
              placeholder="Task title"
            />
            <textarea
              name="description"
              value={editForm.description}
              onChange={handleEditChange}
              placeholder="Task description"
            />
            <div className={styles.row}>
              <select name="priority" value={editForm.priority} onChange={handleEditChange}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              <input
                type="date"
                name="dueDate"
                min={todayDateInput()}
                value={editForm.dueDate}
                onChange={handleEditChange}
              />
            </div>
          </div>
        ) : (
          <>
            <p className={styles.title}>{todo.title}</p>
            {todo.description ? <p className={styles.description}>{todo.description}</p> : null}
            <div className={styles.meta}>
              <span className={styles.priority}>{todo.priority}</span>
              <span className={todo.isCompleted ? styles.statusCompleted : styles.statusPending}>
                {todo.isCompleted ? "Completed" : "Pending"}
              </span>
              {todo.dueDate ? (
                <span>Due: {new Date(todo.dueDate).toLocaleDateString()}</span>
              ) : (
                <span>No due date</span>
              )}
            </div>
          </>
        )}
      </div>

      <div className={styles.actions}>
        {!todo.isCompleted && editingTodoId !== todo._id ? (
          <button type="button" className={styles.editBtn} onClick={() => startEdit(todo)}>
            Edit
          </button>
        ) : null}
        {!todo.isCompleted && editingTodoId === todo._id ? (
          <>
            <button type="button" className={styles.toggleBtn} onClick={() => saveEdit(todo._id)}>
              Save
            </button>
            <button type="button" className={styles.secondaryBtn} onClick={cancelEdit}>
              Cancel
            </button>
          </>
        ) : null}
        {!todo.isCompleted && editingTodoId !== todo._id ? (
          <button type="button" className={styles.toggleBtn} onClick={() => toggleTodo(todo._id)}>
            Mark Done
          </button>
        ) : null}
        <button type="button" className={styles.deleteBtn} onClick={() => deleteTodo(todo._id)}>
          Delete
        </button>
      </div>
    </li>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Todo List</h2>
      </div>

      <form className={styles.form} onSubmit={handleCreate}>
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Task title"
          required
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Task description (optional)"
        />
        <div className={styles.row}>
          <select name="priority" value={form.priority} onChange={handleChange}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <input
            type="date"
            name="dueDate"
            min={todayDateInput()}
            value={form.dueDate}
            onChange={handleChange}
          />
        </div>
        <button type="submit" className={styles.addBtn}>
          Add Task
        </button>
      </form>

      {errorText ? <p className={styles.error}>{errorText}</p> : null}
      {loading ? <p>Loading todos...</p> : null}

      {!loading && (
        <div className={styles.lists}>
          <div className={styles.card}>
            <h3>Pending ({openTodos.length})</h3>
            <ul className={styles.todoList}>
              {openTodos.length ? openTodos.map(renderTodoItem) : <li className={styles.empty}>No pending tasks</li>}
            </ul>
          </div>
          <div className={styles.card}>
            <h3>Completed ({doneTodos.length})</h3>
            <ul className={styles.todoList}>
              {doneTodos.length ? doneTodos.map(renderTodoItem) : <li className={styles.empty}>No completed tasks</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoList;
