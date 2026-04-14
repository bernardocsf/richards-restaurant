import { Router } from 'express';
import {
  createBlock,
  createManualReservation,
  createReservation,
  getDashboardSummary,
  getReservation,
  getSettings,
  listBlocks,
  listReservationAvailability,
  listReservations,
  patchBlock,
  patchReservation,
  patchReservationStatus,
  patchSettings,
  removeBlock,
  removeReservation
} from '../controllers/reservation.controller';
import { adminAuth } from '../middleware/admin-auth';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.get('/availability', asyncHandler(listReservationAvailability));
router.post('/', asyncHandler(createReservation));

router.use(adminAuth);

router.post('/manual', asyncHandler(createManualReservation));
router.get('/settings', asyncHandler(getSettings));
router.patch('/settings', asyncHandler(patchSettings));
router.get('/blocks', asyncHandler(listBlocks));
router.post('/blocks', asyncHandler(createBlock));
router.patch('/blocks/:id', asyncHandler(patchBlock));
router.delete('/blocks/:id', asyncHandler(removeBlock));
router.get('/dashboard', asyncHandler(getDashboardSummary));
router.get('/', asyncHandler(listReservations));
router.get('/:id', asyncHandler(getReservation));
router.patch('/:id/status', asyncHandler(patchReservationStatus));
router.patch('/:id', asyncHandler(patchReservation));
router.delete('/:id', asyncHandler(removeReservation));

export default router;
