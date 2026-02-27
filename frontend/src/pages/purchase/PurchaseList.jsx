import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import DataTable from "../../components/common/DataTable";
import styles from "./PurchaseList.module.css";

const PurchaseList = () => {
  const [purchases, setPurchases] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [errorText, setErrorText] = useState("");
  const navigate = useNavigate();

  const fetchPurchases = async (params) => {
    try {
      const query = new URLSearchParams(params).toString();
      const { data } = await API.get(`/purchase?${query}`);

      setPurchases(data.data);
      setTotalPages(data.totalPages || 1);
      setErrorText("");
    } catch (error) {
      console.error("Error fetching purchases", error);
      setErrorText(error.response?.data?.message || "Failed to load purchases");
    }
  };

  const columns = [
    {
      key: "supplier",
      label: "Supplier",
      render: (row) => row.supplier?.supplierName || "N/A",
    },
    { key: "materialType", label: "Material" },
    { key: "lotNumber", label: "Lot" },
    { key: "quantity", label: "Quantity" },
    { key: "unit", label: "Unit" },
    {
      key: "createdAt",
      label: "Date",
      render: (row) =>
        new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Purchase Management</h2>
        <button
          className={styles.addButton}
          onClick={() => navigate("/purchase/add")}
        >
          + Add Purchase
        </button>
      </div>

      <DataTable
        columns={columns}
        data={purchases}
        serverMode={true}
        totalPages={totalPages}
        onFetchData={fetchPurchases}
        searchField="lotNumber"
        title="purchase-management"
      />
      {errorText && <p style={{ color: "#b91c1c", marginTop: 10 }}>{errorText}</p>}
    </div>
  );
};

export default PurchaseList;
