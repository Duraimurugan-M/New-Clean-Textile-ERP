import Supplier from "../models/Supplier.js";

// Create Supplier
export const createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);

    res.status(201).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Suppliers
export const getSuppliers = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const sortBy = req.query.sortBy || "createdAt";
    const order = req.query.order === "asc" ? 1 : -1;
    const search = String(req.query.search || "").trim();
    const activeOnly = String(req.query.activeOnly || "") === "true";

    const filters = {};
    if (search) {
      filters.$or = [
        { supplierName: { $regex: search, $options: "i" } },
        { contactPerson: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }
    if (activeOnly) filters.isActive = true;

    const totalRecords = await Supplier.countDocuments(filters);
    const suppliers = await Supplier.find(filters)
      .sort({ [sortBy]: order })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: suppliers,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
      totalRecords,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSupplierStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { isActive: Boolean(isActive) },
      { returnDocument: "after" }
    );
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Supplier (Dev only)
export const deleteSupplier = async (req, res) => {
  try {
    await Supplier.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Supplier deleted",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
