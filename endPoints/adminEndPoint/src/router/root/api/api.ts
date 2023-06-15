import express from 'express';
import Middleware from 'storets-middleware';
import LocalModules from './localModules';

const api = express.Router();

api.post(
	'/website',
	LocalModules.middlewareCheckToken,
	Middleware.middlewareBuildWebsite,
	(req, res) => {
		res.json(Object(req).builder.website);
	},
);

api.post(
	'/header',
	LocalModules.middlewareCheckToken,
	Middleware.middlewareBuildHeader(true),
	(req, res) => {
		res.json(Object(req).builder.header);
	},
);

api.post(
	'/propagandas',
	LocalModules.middlewareCheckToken,
	Middleware.middlewareBuildPropagandas(true),
	(req, res) => {
		res.json(Object(req).builder.propagandas);
	},
);

api.post(
	'/products',
	LocalModules.middlewareCheckToken,
	Middleware.middlewareBuildProducts(true),
	(req, res) => {
		res.json(Object(req).builder.products);
	},
);

api.post(
	'/footer',
	LocalModules.middlewareCheckToken,
	Middleware.middlewareBuildFooter,
	(req, res) => {
		res.json(Object(req).builder.footer);
	},
);

api.post(
	'/propaganda',
	LocalModules.middlewareUploadFiles(2, 2),
	LocalModules.middlewareCheckToken,
	LocalModules.middlewarePostPropaganda,
	(_, res) => {
		res.json({ status: 200 });
	},
);

api.post(
	'/category',
	LocalModules.middlewareCheckToken,
	LocalModules.middlewarePostCategory,
	(_, res) => {
		res.json({ status: 200 });
	},
);

api.post(
	'/product',
	LocalModules.middlewareUploadFiles(1, 1),
	LocalModules.middlewareCheckToken,
	LocalModules.middlewarePostProduct,
	(_, res) => {
		res.json({ status: 200 });
	},
);

api.put(
	[
		'/header/title',
		'/header/description',
		'/header/color',
		'/categories/name',
		'/products/category',
		'/products/name',
		'/products/price',
		'/products/off',
		'/products/installment',
		'/products/whatsapp',
		'/products/message',
		'/footer/title',
		'/footer/text',
		'/footer/whatsapp',
		'/footer/facebook',
		'/footer/instagram',
		'/footer/storeInfo',
		'/footer/completeStoreInfo',
	],
	LocalModules.middlewareCheckToken,
	LocalModules.middlewarePutText,
	(_, res) => {
		res.json({ status: 200 });
	},
);

api.put(
	[
		'/header/icon',
		'/header/logo',
		'/propagandas/bigImage',
		'/propagandas/smallImage',
		'/products/image',
	],
	LocalModules.middlewareUploadFiles(1, 1),
	LocalModules.middlewareCheckToken,
	LocalModules.middlewarePutImage,
	(_, res) => {
		res.json({ status: 200 });
	},
);

api.put(
	['/propagandas', '/products'],
	LocalModules.middlewareCheckToken,
	LocalModules.middlewarePutPosition,
	(_, res) => {
		res.json({ status: 200 });
	},
);

api.delete(
	'/propaganda',
	LocalModules.middlewareCheckToken,
	LocalModules.middlewareDeletePropaganda,
	(_, res) => {
		res.json({ status: 200 });
	},
);

api.delete(
	'/category',
	LocalModules.middlewareCheckToken,
	LocalModules.middlewareDeleteCategory,
	(_, res) => {
		res.json({ status: 200 });
	},
);

api.delete(
	'/product',
	LocalModules.middlewareCheckToken,
	LocalModules.middlewareDeleteProduct,
	(_, res) => {
		res.json({ status: 200 });
	},
);

export default api;
