import express from "express";
import { renderData, postData } from "../controllers/nutrition.js";

const router = express.Router();

router.get("/", renderData);
router.post("/", postData);


export { router as nutritionalRoute };