import express from 'express';
import root from './root/root';
import admin from './admin/admin';

const router: express.Router = express.Router();

router.use('/', root);
router.use('/admin', admin);

export default router;
