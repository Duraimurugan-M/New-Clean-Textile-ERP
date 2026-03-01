import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  deleteFileDocument,
  getFileDocuments,
  uploadFileDocument,
} from "../controllers/fileManagerController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getFileDocuments);
router.post("/", upload.single("file"), uploadFileDocument);
router.delete("/:id", deleteFileDocument);

export default router;
