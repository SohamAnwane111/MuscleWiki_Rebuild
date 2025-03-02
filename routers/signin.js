import express from "express";
import { renderForm } from "../controllers/signin.js";

const router = express.Router();

router.get("/", renderForm);

export { router as signInRoute };