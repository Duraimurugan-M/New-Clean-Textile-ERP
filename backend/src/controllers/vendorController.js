import Vendor from "../models/Vendor.js";

// 🔹 Create Vendor
export const createVendor = async (req, res) => {
  try {
    const vendor = await Vendor.create({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Vendor created successfully",
      data: vendor,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Get Vendors (Server Side Ready)
export const getVendors = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const sortBy = req.query.sortBy || "createdAt";
    const order = req.query.order === "asc" ? 1 : -1;
    const search = String(req.query.search || "").trim();

    const filters = {};
    if (search) {
      filters.$or = [
        { vendorName: { $regex: search, $options: "i" } },
        { contactPerson: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const totalRecords = await Vendor.countDocuments(filters);
    const vendors = await Vendor.find(filters)
      .sort({ [sortBy]: order })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: vendors,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
      totalRecords,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    res.json({ success: true, data: vendor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateVendorStatus = async (req, res) => {
  try {
    const status = req.body.status === "Inactive" ? "Inactive" : "Active";
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: "after" }
    );
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    res.json({ success: true, data: vendor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteVendor = async (req, res) => {
  try {
    await Vendor.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Vendor deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Delete All Vendors (Dev Only)
export const deleteAllVendors = async (req, res) => {
  try {
    await Vendor.deleteMany();

    res.json({
      success: true,
      message: "All vendors deleted",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
