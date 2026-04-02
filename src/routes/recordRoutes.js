import express from 'express';
import * as recordController from '../controllers/recordController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('admin'), recordController.createRecord);
router.patch('/:id', authorize('admin'), recordController.updateRecord);
router.delete('/:id', authorize('admin'), recordController.deleteRecord);

router.get('/', authorize('admin', 'analyst', 'viewer'), recordController.getRecords);
router.get('/:id', authorize('admin', 'analyst', 'viewer'), recordController.getRecordById);

export default router;

