import { Router } from 'express';
import { getFields, createField } from '../controllers/FieldController.js';

const router = Router();

router.get('/', getFields);
router.post('/', createField);

export default router;
