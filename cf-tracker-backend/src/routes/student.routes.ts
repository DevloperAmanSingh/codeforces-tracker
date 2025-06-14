import { Router } from "express";
import {
  createStudent,
  getStudents,
  updateCFHandle,
  deleteStudent,
  getStudentById,
  updateAutoReminder,
} from "../controllers/student.controller";

const router = Router();

router.post("/", createStudent);
router.get("/", getStudents);
router.get("/:id", getStudentById);
router.patch("/:id/cf-handle", updateCFHandle);
router.patch("/:id/auto-reminder", updateAutoReminder);
router.delete("/:id", deleteStudent);

export default router;
