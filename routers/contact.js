import express from "express";
import { renderContactDetails } from "../controllers/contact.js";

const router = express.Router();

router.get("/", renderContactDetails);

export { router as contactRoute };