import { useState, useEffect } from "react";
import styles from "./DataTable.module.css";

const DataTable = ({
  columns,
  data,
  serverMode = false,
  totalPages = 1,
  onFetchData,
  searchField = "",
}) => {
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");

  // 🔥 If server mode, fetch whenever change
  useEffect(() => {
    if (serverMode && onFetchData) {
      onFetchData({
        page: currentPage,
        limit: rowsPerPage,
        search,
        sortBy,
        order,
      });
    }
  }, [currentPage, rowsPerPage, search, sortBy, order, onFetchData, serverMode]);

  const handleSort = (key) => {
    const newOrder =
      sortBy === key && order === "asc" ? "desc" : "asc";

    setSortBy(key);
    setOrder(newOrder);
  };

  return (
    <div className={styles.container}>
      {/* 🔎 Search */}
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

      {/* 📋 Table */}
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
                {sortBy === col.key &&
                  (order === "asc" ? " 🔼" : " 🔽")}
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
                  <td key={col.key}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* 📄 Pagination */}
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
          >
            ◀
          </button>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
