import { prisma } from "../lib/prisma";
import { Request, Response } from "express";

export const createStudent = async (req: Request, res: Response) => {
  const { name, email, phone, cfHandle } = req.body;
  try {
    const student = await prisma.student.create({
      data: { name, email, phone, cfHandle },
    });
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ error: "CF handle may already exist." });
  }
};

export const getStudents = async (_: Request, res: Response) => {
  const students = await prisma.student.findMany();
  res.json(students);
};

export const getStudentById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      contests: true,
      problems: true,
    },
  });
  res.json(student);
};

export const updateCFHandle = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { cfHandle } = req.body;
  try {
    const student = await prisma.student.update({
      where: { id },
      data: { cfHandle, lastUpdated: null },
    });
    // TODO: Trigger real-time sync here
    res.json(student);
  } catch {
    res.status(400).json({ error: "Invalid student or handle" });
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.student.delete({ where: { id } });
  res.status(204).send();
};

export const updateAutoReminder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { autoReminder } = req.body;
  try {
    const student = await prisma.student.update({
      where: { id },
      data: { autoReminder: autoReminder === true },
    });
    res.json(student);
  } catch {
    res.status(400).json({ error: "Invalid student" });
  }
};
