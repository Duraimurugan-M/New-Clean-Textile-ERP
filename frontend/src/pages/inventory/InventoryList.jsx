import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../../api/axios";
import DataTable from "../../components/common/DataTable";
import styles from "./InventoryList.module.css";

const InventoryList = () => {
  const [inventory, setInventory] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();

  // 🔹 Fetch inventory with server-side pagination
  const fetchInventory = async (params) => {
    try {
      const merged = new URLSearchParams(location.search);
      Object.entries(params || {}).forEach(([key, value]) => merged.set(key, value));
      const query = merged.toString();
      const { data } = await API.get(`/inventory?${query}`);

      setInventory(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching inventory", error);
    }
  };

  const columns = [
    { key: "materialType", label: "Material" },
    { key: "lotNumber", label: "Lot Number" },
    { key: "quantity", label: "Quantity" },
    { key: "unit", label: "Unit" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span
          className={`${styles.status} ${styles[row.status]}`}
        >
          {row.status}
        </span>
      ),
    },
    { key: "location", label: "Location" },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Inventory Management</h2>
        <button
          className={styles.addButton}
          onClick={() => navigate("/inventory/add")}
        >
          + Add Inventory
        </button>
      </div>

      <DataTable
        columns={columns}
        data={inventory}
        serverMode={true}
        totalPages={totalPages}
        onFetchData={fetchInventory}
        searchField="lotNumber"
      />
    </div>
  );
};

export default InventoryList;
