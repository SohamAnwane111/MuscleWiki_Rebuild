import express from "express";
import { renderData, postData } from "../controllers/analyzefoodplate.js";

const router = express.Router();

router.get("/", renderData);
router.post("/", postData);

export { router as analyzeFoodPlateRoute };