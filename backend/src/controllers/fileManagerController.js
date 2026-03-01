import FileDocument from "../models/FileDocument.js";
import cloudinary from "../config/cloudinary.js";

export const uploadFileDocument = async (req, res) => {
  try {
    const { title, category, relatedModule, referenceNumber, notes } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    const fileRecord = await FileDocument.create({
      title: title.trim(),
      category: category || "Other",
      relatedModule: relatedModule || "General",
      referenceNumber: referenceNumber?.trim() || "",
      notes: notes?.trim() || "",
      fileUrl: req.file.path,
      publicId: req.file.filename,
      originalName: req.file.originalname,
      format: req.file.format || "",
      resourceType: req.file.resource_type || "raw",
      bytes: req.file.bytes || 0,
      uploadedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      data: fileRecord,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFileDocuments = async (req, res) => {
  try {
    const { search = "", category = "", relatedModule = "" } = req.query;

    const query = {};
    if (search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { referenceNumber: { $regex: search.trim(), $options: "i" } },
        { originalName: { $regex: search.trim(), $options: "i" } },
      ];
    }
    if (category) query.category = category;
    if (relatedModule) query.relatedModule = relatedModule;

    const files = await FileDocument.find(query)
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: files,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteFileDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const fileRecord = await FileDocument.findById(id);

    if (!fileRecord) {
      return res.status(404).json({ message: "File record not found" });
    }

    try {
      await cloudinary.uploader.destroy(fileRecord.publicId, {
        resource_type: fileRecord.resourceType || "raw",
      });
    } catch (cloudinaryError) {
      return res.status(500).json({
        message: `Failed to delete file from cloudinary: ${cloudinaryError.message}`,
      });
    }

    await fileRecord.deleteOne();

    res.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
