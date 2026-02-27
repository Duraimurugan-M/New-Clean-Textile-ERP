import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/auth/Login";
import Layout from "../components/layout/Layout";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import Dashboard from "../pages/dashboard/Dashboard";
import InventoryList from "../pages/inventory/InventoryList";
import AddInventory from "../pages/inventory/AddInventory";
import PurchaseList from "../pages/purchase/PurchaseList";
import AddPurchase from "../pages/purchase/AddPurchase";
import ProductionList from "../pages/production/ProductionList";
import AddProduction from "../pages/production/AddProduction";
import SalesList from "../pages/sales/SalesList";
import AddSales from "../pages/sales/AddSales";
import CustomerList from "../pages/customer/CustomerList";
import AddCustomer from "../pages/customer/AddCustomer";
import SupplierList from "../pages/supplier/SupplierList";
import AddSupplier from "../pages/supplier/AddSupplier";
import QCList from "../pages/qc/QCList";
import AddQC from "../pages/qc/AddQC";
import StockMovementList from "../pages/stockMovement/StockMovementList";
import VendorList from "../pages/vendor/VendorList";
import AddVendor from "../pages/vendor/AddVendor";
import JobWorkList from "../pages/jobWork/JobWorkList";
import AddJobWork from "../pages/jobWork/AddJobWork";
import BeamList from "../pages/beam/BeamList";
import AddBeam from "../pages/beam/AddBeam";
import SalesOrderList from "../pages/salesOrder/SalesOrderList";
import AddSalesOrder from "../pages/salesOrder/AddSalesOrder";
import DispatchList from "../pages/dispatch/DispatchList";
import AddDispatch from "../pages/dispatch/AddDispatch";
import AccountsList from "../pages/accounts/AccountsList";
import AddAccountEntry from "../pages/accounts/AddAccountEntry";
import Reports from "../pages/reports/Reports";
import ProductionPlanList from "../pages/productionPlan/ProductionPlanList";
import AddProductionPlan from "../pages/productionPlan/AddProductionPlan";

const AppRoutes = () => {
  const withLayout = (element) => (
    <ProtectedRoute>
      <Layout>
        {element}
      </Layout>
    </ProtectedRoute>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/dashboard" element={withLayout(<Dashboard />)} />

        <Route path="/inventory" element={withLayout(<InventoryList />)} />

        <Route path="/inventory/add" element={withLayout(<AddInventory />)} />

        <Route path="/purchase" element={withLayout(<PurchaseList />)} />

        <Route path="/purchase/add" element={withLayout(<AddPurchase />)} />

        <Route path="/production" element={withLayout(<ProductionList />)} />

        <Route path="/production/add" element={withLayout(<AddProduction />)} />

        <Route path="/production-plans" element={withLayout(<ProductionPlanList />)} />

        <Route path="/production-plans/add" element={withLayout(<AddProductionPlan />)} />

        <Route path="/sales" element={withLayout(<SalesList />)} />

        <Route path="/sales/add" element={withLayout(<AddSales />)} />

        <Route path="/sales-orders" element={withLayout(<SalesOrderList />)} />

        <Route path="/sales-orders/add" element={withLayout(<AddSalesOrder />)} />

        <Route path="/customer" element={withLayout(<CustomerList />)} />

        <Route path="/customer/add" element={withLayout(<AddCustomer />)} />

        <Route path="/supplier" element={withLayout(<SupplierList />)} />

        <Route path="/supplier/add" element={withLayout(<AddSupplier />)} />

        <Route path="/qc" element={withLayout(<QCList />)} />

        <Route path="/qc/add" element={withLayout(<AddQC />)} />

        <Route path="/stock-movement" element={withLayout(<StockMovementList />)} />

        <Route path="/beams" element={withLayout(<BeamList />)} />

        <Route path="/beams/add" element={withLayout(<AddBeam />)} />

        <Route path="/vendors" element={withLayout(<VendorList />)} />

        <Route path="/vendors/add" element={withLayout(<AddVendor />)} />

        <Route path="/job-work" element={withLayout(<JobWorkList />)} />

        <Route path="/job-work/add" element={withLayout(<AddJobWork />)} />

        <Route path="/dispatch" element={withLayout(<DispatchList />)} />

        <Route path="/dispatch/add" element={withLayout(<AddDispatch />)} />

        <Route path="/accounts" element={withLayout(<AccountsList />)} />

        <Route path="/accounts/add" element={withLayout(<AddAccountEntry />)} />

        <Route path="/reports" element={withLayout(<Reports />)} />

      </Routes>
    </BrowserRouter>

  );
};

export default AppRoutes;
