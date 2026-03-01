import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import styles from "../sales/AddSales.module.css";

const AddAccountEntry = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    entryType: "Expense",
    partyType: "Other",
    partyName: "",
    referenceType: "Manual",
    amount: "",
    taxableAmount: "",
    gstAmount: "",
    debit: "",
    credit: "",
    dueDate: "",
    status: "Pending",
    notes: "",
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/accounts", form);
      navigate("/accounts");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create account entry");
    }
  };

  return (
    <div className={styles.container}>
      <h2>Add Ledger Entry</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Entry Type</label>
          <select name="entryType" value={form.entryType} onChange={handleChange}>
            <option value="PurchaseInvoice">Purchase Invoice</option>
            <option value="SalesInvoice">Sales Invoice</option>
            <option value="Expense">Expense</option>
            <option value="PaymentReceived">Payment Received</option>
            <option value="PaymentPaid">Payment Paid</option>
            <option value="GST">GST</option>
          </select>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Party Type</label>
          <select name="partyType" value={form.partyType} onChange={handleChange}>
            <option value="Customer">Customer</option>
            <option value="Supplier">Supplier</option>
            <option value="Vendor">Vendor</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Party Name</label>
          <input name="partyName" placeholder="Party Name" value={form.partyName} onChange={handleChange} />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Reference Type</label>
          <select name="referenceType" value={form.referenceType} onChange={handleChange}>
            <option value="Manual">Manual</option>
            <option value="Purchase">Purchase</option>
            <option value="Sales">Sales</option>
            <option value="SalesOrder">Sales Order</option>
            <option value="Dispatch">Dispatch</option>
          </select>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Amount</label>
          <input type="number" name="amount" placeholder="Amount" value={form.amount} onChange={handleChange} required />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Taxable Amount</label>
          <input type="number" name="taxableAmount" placeholder="Taxable Amount" value={form.taxableAmount} onChange={handleChange} />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>GST Amount</label>
          <input type="number" name="gstAmount" placeholder="GST Amount" value={form.gstAmount} onChange={handleChange} />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Debit</label>
          <input type="number" name="debit" placeholder="Debit" value={form.debit} onChange={handleChange} />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Credit</label>
          <input type="number" name="credit" placeholder="Credit" value={form.credit} onChange={handleChange} />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Due Date</label>
          <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Status</label>
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="Pending">Pending</option>
            <option value="PartiallyPaid">Partially Paid</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Notes</label>
          <input name="notes" placeholder="Notes" value={form.notes} onChange={handleChange} />
        </div>
        <button type="submit" className={styles.button}>
          Save Entry
        </button>
      </form>
    </div>
  );
};

export default AddAccountEntry;
