import express from 'express';
import admin from './admin/admin';

const router: express.Router = express.Router();

router.use('/admin', admin);

export default router;
