import express from 'express';
import { submitContactForm } from '../controllers/contactController.js';
import { contactLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/', contactLimiter, submitContactForm);

export default router;
