import express from 'express';
import root from './root/root';
import Middleware from 'storets-middleware';

const router = express.Router();

router.use('/', root);

router.get('*', Middleware.middlewareBuildHeader, (req, res) => {
	res.status(404).render('404-get-page', { builder: Object(req).builder });
});

export default router;
