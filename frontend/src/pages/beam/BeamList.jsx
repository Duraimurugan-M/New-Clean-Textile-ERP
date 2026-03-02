import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";
import DataTable from "../../components/common/DataTable";
import styles from "../sales/SalesList.module.css";
import hero from "../../styles/moduleHero.module.css";

const BeamList = () => {
  const [beams, setBeams] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBeams = async (params) => {
    try {
      const query = new URLSearchParams(params).toString();
      const { data } = await API.get(`/beams?${query}`);
      setBeams(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching beams", error);
    }
  };

  const columns = [
    { key: "beamNumber", label: "Beam No" },
    { key: "sourceMaterialType", label: "Source Material" },
    { key: "sourceLotNumber", label: "Source Lot" },
    { key: "issueQuantity", label: "Qty" },
    { key: "unit", label: "Unit" },
    { key: "loomNumber", label: "Loom" },
    { key: "status", label: "Status" },
  ];

  return (
    <div className={hero.pageWrapper}>
      <div className={hero.hero}>
        <p className={hero.kicker}>Production Workspace</p>
        <h1 className={hero.title}>Beam Management</h1>
        <p className={hero.subtitle}>Track beam creation with loom allocation and source lot traceability.</p>
      </div>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Beam Register</h2>
          <Link to="/beams/add" className={styles.addBtn}>
            + Create Beam
          </Link>
        </div>

        <DataTable
          columns={columns}
          data={beams}
          serverMode
          totalPages={totalPages}
          onFetchData={fetchBeams}
          searchField="Beam Number"
        />
      </div>
    </div>
  );
};

export default BeamList;
