import express from 'express';
import api from './api/api';
import { GlobalMiddlewareModules } from '../../globalModules';

const root = express.Router();

root.get(
	'/',
	GlobalMiddlewareModules.buildHeaderMiddleware,
	GlobalMiddlewareModules.buildPropagandasMiddleware,
	GlobalMiddlewareModules.buildProductsMiddleware,
	GlobalMiddlewareModules.buildFooterMiddleware,
	(req, res) => {
		res.render('root-get-page', { builder: Object(req).builder });
	},
);

root.use('/api', api);

export default root;
