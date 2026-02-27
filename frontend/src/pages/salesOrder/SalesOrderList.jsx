import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";
import DataTable from "../../components/common/DataTable";
import styles from "../sales/SalesList.module.css";

const SalesOrderList = () => {
  const [orders, setOrders] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = async (params) => {
    try {
      const query = new URLSearchParams(params).toString();
      const { data } = await API.get(`/sales-orders?${query}`);
      setOrders(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching sales orders", error);
    }
  };

  const columns = [
    { key: "orderNumber", label: "Order No" },
    {
      key: "customer",
      label: "Customer",
      render: (row) => row.customer?.customerName || "N/A",
    },
    {
      key: "deliveryDate",
      label: "Delivery Date",
      render: (row) => new Date(row.deliveryDate).toLocaleDateString(),
    },
    { key: "totalQuantity", label: "Total Qty" },
    {
      key: "totalAmount",
      label: "Amount",
      render: (row) => `Rs. ${row.totalAmount}`,
    },
    { key: "status", label: "Status" },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Sales Orders</h2>
        <Link to="/sales-orders/add" className={styles.addBtn}>
          + Create Order
        </Link>
      </div>
      <DataTable
        columns={columns}
        data={orders}
        serverMode
        totalPages={totalPages}
        onFetchData={fetchOrders}
        searchField="orderNumber"
      />
    </div>
  );
};

export default SalesOrderList;
