import { Router } from 'express';
import {
  createReview,
  listReviews,
  removeReview
} from '../controllers/review.controller';
import { adminAuth } from '../middleware/admin-auth';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.post('/', asyncHandler(createReview));
router.get('/', asyncHandler(listReviews));
router.delete('/:id', adminAuth, asyncHandler(removeReview));

export default router;
