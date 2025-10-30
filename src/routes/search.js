import { Router } from 'express';
import { searchNews } from '../controllers/searchController.js';
const router = Router();
router.get('/', searchNews);
export default router;
