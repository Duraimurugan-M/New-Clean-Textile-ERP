import Customer from "../models/Customer.js";

// Create Customer
export const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);

    res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Customers
export const getCustomers = async (req, res) => {
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
        { customerName: { $regex: search, $options: "i" } },
        { contactPerson: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }
    if (activeOnly) filters.isActive = true;

    const totalRecords = await Customer.countDocuments(filters);
    const customers = await Customer.find(filters)
      .sort({ [sortBy]: order })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: customers,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
      totalRecords,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCustomerStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { isActive: Boolean(isActive) },
      { returnDocument: "after" }
    );
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Customer (Dev Only)
export const deleteCustomer = async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Customer deleted",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
