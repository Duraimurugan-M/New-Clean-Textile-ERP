import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import styles from "./Yarn.module.css";

const AddYarn = () => {
    const navigate = useNavigate();
    const [suppliers, setSuppliers] = useState([]);

    const [form, setForm] = useState({
        yarnName: "",
        count: "",
        composition: "",
        shade: "Raw",
        supplier: "",
        lotNumber: "",
        quantity: "",
        unit: "kg",
    });

    useEffect(() => {
        const loadSuppliers = async () => {
            const { data } = await API.get("/suppliers");
            setSuppliers(data.data);
        };
        loadSuppliers();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.post("/yarn", form);
            navigate("/yarn");
        } catch (error) {
            alert(error.response?.data?.message || "Failed to create yarn");
        }
    };

    return (
        <div className={`${styles.container} ${styles.formPage}`}>
            <h2>Add Yarn</h2>

            <form onSubmit={handleSubmit} className={styles.form}>
                <input
                    name="yarnName"
                    placeholder="Yarn Name"
                    onChange={handleChange}
                    required
                />

                <input
                    name="count"
                    placeholder="Count (40s, 60s)"
                    onChange={handleChange}
                    required
                />

                <input
                    name="composition"
                    placeholder="Composition (Cotton, PC)"
                    onChange={handleChange}
                    required
                />

                <select name="shade" onChange={handleChange} value={form.shade}>
                    <option value="Raw">Raw</option>
                    <option value="Bleached">Bleached</option>
                    <option value="Dyed">Dyed</option>
                </select>

                <select name="supplier" onChange={handleChange}>
                    <option value="">Select Supplier</option>
                    {suppliers.map((sup) => (
                        <option key={sup._id} value={sup._id}>
                            {sup.supplierName}
                        </option>
                    ))}
                </select>

                <input
                    name="lotNumber"
                    placeholder="Lot Number"
                    onChange={handleChange}
                    required
                />

                <input
                    type="number"
                    name="quantity"
                    placeholder="Quantity"
                    onChange={handleChange}
                    required
                />

                <select name="unit" onChange={handleChange}>
                    <option value="kg">KG</option>
                    <option value="cone">Cone</option>
                </select>

                <button type="submit" className={styles.submitBtn}>
                    Create Yarn
                </button>
            </form>
        </div>
    );
};

export default AddYarn;
