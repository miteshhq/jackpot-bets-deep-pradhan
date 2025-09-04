import express from 'express';
import {
  getResults,
  generateManualResult,
  setManualResult
} from '../controllers/resultController.js';

const router = express.Router();

router.get('/', getResults);
router.post('/generate', generateManualResult);
router.post('/set-manual-result', setManualResult); // ✅ Admin sets number

export default router;


