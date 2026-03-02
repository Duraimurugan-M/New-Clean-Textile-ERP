import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";
import DataTable from "../../components/common/DataTable";
import styles from "../sales/SalesList.module.css";
import hero from "../../styles/moduleHero.module.css";

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
    <div className={hero.pageWrapper}>
      <div className={hero.hero}>
        <p className={hero.kicker}>Sales Workspace</p>
        <h1 className={hero.title}>Sales Orders</h1>
        <p className={hero.subtitle}>Create and track customer order commitments for production planning.</p>
      </div>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Order Register</h2>
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
          searchField="Order Number"
        />
      </div>
    </div>
  );
};

export default SalesOrderList;
