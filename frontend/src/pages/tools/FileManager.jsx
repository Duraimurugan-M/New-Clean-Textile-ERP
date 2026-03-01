import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import styles from "./FileManager.module.css";

const categoryOptions = ["PurchaseBill", "SalesBill", "DispatchBill", "QCReport", "Other"];
const moduleOptions = ["Purchase", "Sales", "Dispatch", "QC", "Inventory", "General"];

const defaultForm = {
  title: "",
  category: "PurchaseBill",
  relatedModule: "Purchase",
  referenceNumber: "",
  notes: "",
};

const formatBytes = (bytes) => {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / 1024 ** i;
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${sizes[i]}`;
};

const FileManager = () => {
  const [form, setForm] = useState(defaultForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(categoryFilter ? { category: categoryFilter } : {}),
        ...(moduleFilter ? { relatedModule: moduleFilter } : {}),
      }).toString();

      const { data } = await API.get(`/tools/files${query ? `?${query}` : ""}`);
      setFiles(data.data || []);
      setErrorText("");
    } catch (error) {
      setErrorText(error.response?.data?.message || "Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [search, categoryFilter, moduleFilter]);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setErrorText("Title is required");
      return;
    }
    if (!selectedFile) {
      setErrorText("Please choose a file");
      return;
    }

    try {
      setUploading(true);
      const payload = new FormData();
      payload.append("title", form.title.trim());
      payload.append("category", form.category);
      payload.append("relatedModule", form.relatedModule);
      payload.append("referenceNumber", form.referenceNumber.trim());
      payload.append("notes", form.notes.trim());
      payload.append("file", selectedFile);

      await API.post("/tools/files", payload);

      setForm(defaultForm);
      setSelectedFile(null);
      const inputEl = document.getElementById("file-upload-input");
      if (inputEl) inputEl.value = "";

      await fetchFiles();
    } catch (error) {
      setErrorText(error.response?.data?.message || "File upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Delete this file permanently?");
    if (!confirmDelete) return;

    try {
      await API.delete(`/tools/files/${id}`);
      await fetchFiles();
    } catch (error) {
      setErrorText(error.response?.data?.message || "Failed to delete file");
    }
  };

  const filteredInfo = useMemo(() => `${files.length} file(s)`, [files.length]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>File Manager</h2>
      </div>

      <form className={styles.form} onSubmit={handleUpload}>
        <div className={styles.grid2}>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Document title (e.g., Purchase Bill #1024)"
            required
          />
          <input
            type="text"
            name="referenceNumber"
            value={form.referenceNumber}
            onChange={handleChange}
            placeholder="Reference number (optional)"
          />
        </div>

        <div className={styles.grid3}>
          <select name="category" value={form.category} onChange={handleChange}>
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select name="relatedModule" value={form.relatedModule} onChange={handleChange}>
            {moduleOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <input
            id="file-upload-input"
            type="file"
            onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
            required
          />
        </div>

        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          placeholder="Notes (optional)"
        />

        <button type="submit" className={styles.uploadBtn} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload File"}
        </button>
      </form>

      {errorText ? <p className={styles.error}>{errorText}</p> : null}

      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="Search by title, reference, file name"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="">All Categories</option>
          {categoryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}>
          <option value="">All Modules</option>
          {moduleOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <p className={styles.meta}>{loading ? "Loading..." : filteredInfo}</p>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Module</th>
              <th>Ref</th>
              <th>Size</th>
              <th>Uploaded</th>
              <th>By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.length === 0 ? (
              <tr>
                <td colSpan="8" className={styles.empty}>
                  No files found
                </td>
              </tr>
            ) : (
              files.map((item) => (
                <tr key={item._id}>
                  <td title={item.originalName}>{item.title}</td>
                  <td>{item.category}</td>
                  <td>{item.relatedModule}</td>
                  <td>{item.referenceNumber || "-"}</td>
                  <td>{formatBytes(item.bytes)}</td>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td>{item.uploadedBy?.name || "-"}</td>
                  <td>
                    <div className={styles.actions}>
                      <a href={item.fileUrl} target="_blank" rel="noreferrer" className={styles.viewBtn}>
                        View
                      </a>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(item._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FileManager;
