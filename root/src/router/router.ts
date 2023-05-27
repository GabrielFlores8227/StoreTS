import express from 'express';
import root from './root/root';

const router = express.Router();

router.use('/', root);

export default router;
