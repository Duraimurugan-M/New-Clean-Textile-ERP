import { useState, useEffect, useRef } from "react";
import styles from "./DataTable.module.css";

const DataTable = ({
  columns,
  data,
  serverMode = false,
  totalPages = 1,
  onFetchData,
  searchField = "",
  title = "table-data",
}) => {
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const onFetchDataRef = useRef(onFetchData);
  const lastQueryRef = useRef("");

  useEffect(() => {
    onFetchDataRef.current = onFetchData;
  }, [onFetchData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 280);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch on filter/sort/page change in server mode
  useEffect(() => {
    if (serverMode && onFetchDataRef.current) {
      const payload = {
        page: currentPage,
        limit: rowsPerPage,
        search: debouncedSearch,
        sortBy,
        order,
      };
      const queryKey = JSON.stringify(payload);

      if (lastQueryRef.current === queryKey) return;
      lastQueryRef.current = queryKey;

      onFetchDataRef.current(payload);
    }
  }, [currentPage, rowsPerPage, debouncedSearch, sortBy, order, serverMode]);

  const handleSort = (key) => {
    const newOrder = sortBy === key && order === "asc" ? "desc" : "asc";
    setSortBy(key);
    setOrder(newOrder);
  };

  const exportExcel = () => {
    const headers = columns.map((col) => col.label);
    const rows = data.map((row) =>
      columns.map((col) => {
        const value = col.render ? col.render(row) : row[col.key];
        if (typeof value === "object") {
          return row[col.key] ?? "";
        }
        if (typeof value === "string") {
          return value.replace(/,/g, " ");
        }
        return value ?? "";
      })
    );
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${title}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  };

  const exportPdf = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    const headerHtml = columns.map((col) => `<th>${col.label}</th>`).join("");
    const rowHtml = data
      .map((row) => {
        const cols = columns
          .map((col) => {
            const value = col.render ? col.render(row) : row[col.key];
            const safe = typeof value === "object" ? row[col.key] ?? "" : value ?? "";
            return `<td>${safe}</td>`;
          })
          .join("");
        return `<tr>${cols}</tr>`;
      })
      .join("");

    win.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ccc; padding: 8px; font-size: 12px; text-align: left; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h2>${title}</h2>
          <table>
            <thead><tr>${headerHtml}</tr></thead>
            <tbody>${rowHtml}</tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className={styles.container}>
      {searchField && (
        <input
          type="text"
          placeholder={`Search by ${searchField}`}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className={styles.search}
        />
      )}

      <div style={{ marginBottom: 10, display: "flex", gap: 8 }}>
        <button type="button" onClick={exportExcel}>Export Excel</button>
        <button type="button" onClick={exportPdf}>Export PDF</button>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className={styles.sortable}
              >
                {col.label}
                {sortBy === col.key && (order === "asc" ? " ▲" : " ▼")}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.noData}>
                No data found
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row._id}>
                {columns.map((col) => (
                  <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className={styles.pagination}>
        <div>
          Rows:
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div>
          Page {currentPage} of {totalPages}
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            aria-label="Previous page"
          >
            &#x2039;
          </button>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            aria-label="Next page"
          >
            &#x203A;
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
