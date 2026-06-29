import express from 'express';
import { getWilayas, getCommunes, getFees } from '../controllers/yalidineController.js';

const router = express.Router();

router.get('/wilayas', getWilayas);
router.get('/communes', getCommunes);
router.get('/fees', getFees);

export default router;
