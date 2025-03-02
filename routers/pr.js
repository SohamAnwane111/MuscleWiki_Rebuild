import express from "express";
import { renderPr, createPr } from "../controllers/pr.js";

const router = express.Router();

router.get("/", renderPr);
router.post("/", createPr);

export { router as prRoute };