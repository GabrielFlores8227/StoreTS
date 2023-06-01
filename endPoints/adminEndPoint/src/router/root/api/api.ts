import express from 'express';
import { GlobalMiddlewareModules } from '../../../globalModules';
import LocalModules from './localModules';

const api = express.Router();

api.get('/', (req, res) => res.sendStatus(200));

api.post(
	'/g/website',
	LocalModules.middlewareCheckToken,
	GlobalMiddlewareModules.middlewareBuildWebsite,
	(req, res) => {
		res.json(Object(req).builder.website);
	},
);

api.post(
	'/g/header',
	LocalModules.middlewareCheckToken,
	GlobalMiddlewareModules.middlewareBuildHeader,
	(req, res) => {
		res.json(Object(req).builder.header);
	},
);

api.post(
	'/g/propagandas',
	LocalModules.middlewareCheckToken,
	GlobalMiddlewareModules.middlewareBuildPropagandas,
	(req, res) => {
		res.json(Object(req).builder.propagandas);
	},
);

api.post(
	'/g/products',
	LocalModules.middlewareCheckToken,
	GlobalMiddlewareModules.middlewareBuildProductsForAdmin,
	(req, res) => {
		res.json(Object(req).builder.products);
	},
);

api.post(
	'/g/footer',
	LocalModules.middlewareCheckToken,
	GlobalMiddlewareModules.middlewareBuildFooter,
	(req, res) => {
		res.json(Object(req).builder.footer);
	},
);

api.put(
	[
		'/p/header/title',
		'/p/header/description',
		'/p/header/color',
		'/p/categories/name',
		'/p/products/category',
		'/p/products/name',
		'/p/products/price',
		'/p/products/off',
		'/p/products/installment',
		'/p/products/whatsapp',
		'/p/products/message',
		'/p/footer/title',
		'/p/footer/text',
		'/p/footer/whatsapp',
		'/p/footer/facebook',
		'/p/footer/instagram',
		'/p/footer/storeInfo',
		'/p/footer/completeStoreInfo',
	],
	LocalModules.middlewareCheckToken,
	LocalModules.middlewarePutText,
	(req, res) => {
		res.sendStatus(200);
	},
);

export default api;
