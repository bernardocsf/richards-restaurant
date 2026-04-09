import { Router } from 'express';
import {
  createReservation,
  createManualReservation,
  getReservation,
  listReservationAvailability,
  listReservations,
  patchReservationStatus,
  removeReservation
} from '../controllers/reservation.controller';
import { adminAuth } from '../middleware/admin-auth';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.get('/availability', asyncHandler(listReservationAvailability));
router.post('/', asyncHandler(createReservation));
router.post('/manual', adminAuth, asyncHandler(createManualReservation));
router.get('/', adminAuth, asyncHandler(listReservations));
router.get('/:id', adminAuth, asyncHandler(getReservation));
router.patch('/:id/status', adminAuth, asyncHandler(patchReservationStatus));
router.delete('/:id', adminAuth, asyncHandler(removeReservation));

export default router;
