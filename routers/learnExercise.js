import express from "express";
import { renderData, postData } from "../controllers/learnExercise.js";

const router = express.Router();

router.get("/", renderData);
router.post("/", postData);

export { router as learnExerciseRoute };