import express from "express";
import { renderHome, postData } from "../controllers/home.js";

const router = express.Router();

router.get("/", renderHome);
router.post("/", postData);

export { router as homeRoute };