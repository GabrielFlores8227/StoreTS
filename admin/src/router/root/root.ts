import express from 'express';
import { GlobalMiddlewareModules } from '../../globalModules';

const root = express.Router();

root.get('/', GlobalMiddlewareModules.buildHeaderMiddleware, (req, res) => {
	res.render('admin-get-page', { builder: Object(req).builder });
});

export default root;
