import express from "express";
import { renderForm, fillInformation } from "../controllers/signup.js";

const router = express.Router();

router.get("/", renderForm);
router.post("/", fillInformation);

export { router as signUpRoute };