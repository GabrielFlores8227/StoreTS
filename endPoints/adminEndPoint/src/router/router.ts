import express from 'express';
import root from './root/root';
import { GlobalMiddlewareModules } from '../globalModules';

const router = express.Router();

router.use('/', root);

router.get('*', GlobalMiddlewareModules.middlewareBuildHeader, (req, res) => {
	res.status(404).render('404-get-page', { builder: Object(req).builder });
});

export default router;
