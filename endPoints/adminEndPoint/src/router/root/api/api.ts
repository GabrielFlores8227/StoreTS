import express from 'express';
import { GlobalMiddlewareModules } from '../../../globalModules';
import LocalModules from './localModules';

const api = express.Router();

api.post(
	'/g/header',
	LocalModules.middlewareCheckToken,
	GlobalMiddlewareModules.buildHeaderMiddleware,
	(req, res) => {
		res.json(Object(req).builder.header);
	},
);

api.post(
	'/g/propagandas',
	LocalModules.middlewareCheckToken,
	GlobalMiddlewareModules.buildPropagandasMiddleware,
	(req, res) => {
		res.json(Object(req).builder.propagandas);
	},
);

api.post(
	'/g/products',
	LocalModules.middlewareCheckToken,
	GlobalMiddlewareModules.buildProductsMiddleware,
	(req, res) => {
		res.json(Object(req).builder.products);
	},
);

api.post(
	'/g/footer',
	LocalModules.middlewareCheckToken,
	GlobalMiddlewareModules.buildFooterMiddleware,
	(req, res) => {
		res.json(Object(req).builder.footer);
	},
);

export default api;
