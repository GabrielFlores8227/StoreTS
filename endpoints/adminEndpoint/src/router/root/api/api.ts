import express from 'express';
import Middleware from 'storets-middleware';
import LocalModules from './localModules';

const api = express.Router();

api.post(
	'/website',
	Middleware.middlewareCheckToken,
	Middleware.middlewareBuildWebsite,
	(req, res) => {
		res.json(Object(req).builder.website);
	},
);

api.post(
	'/header',
	Middleware.middlewareCheckToken,
	Middleware.middlewareBuildHeader(true),
	(req, res) => {
		res.json(Object(req).builder.header);
	},
);

api.post(
	'/propagandas',
	Middleware.middlewareCheckToken,
	Middleware.middlewareBuildPropagandas(true),
	(req, res) => {
		res.json(Object(req).builder.propagandas);
	},
);

api.post(
	'/categories',
	Middleware.middlewareCheckToken,
	Middleware.middlewareBuildCategories(),
	(req, res) => {
		res.json(Object(req).builder.categories);
	},
);

api.post(
	'/products',
	Middleware.middlewareCheckToken,
	Middleware.middlewareBuildProducts(true),
	(req, res) => {
		res.json(Object(req).builder.products);
	},
);

api.post(
	'/footer',
	Middleware.middlewareCheckToken,
	Middleware.middlewareBuildFooter,
	(req, res) => {
		res.json(Object(req).builder.footer);
	},
);

api.post(
	'/propaganda',
	LocalModules.middlewareUploadFiles(2, 2),
	Middleware.middlewareCheckToken,
	LocalModules.middlewarePostPropaganda,
	(_, res) => {
		res.json({ status: 200 });
	},
);

api.post(
	'/category',
	Middleware.middlewareCheckToken,
	LocalModules.middlewarePostCategory,
	(_, res) => {
		res.json({ status: 200 });
	},
);

api.post(
	'/product',
	LocalModules.middlewareUploadFiles(1, 1),
	Middleware.middlewareCheckToken,
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
		'/footer/location',
		'/footer/store-info',
		'/footer/complete-store-info',
	],
	Middleware.middlewareCheckToken,
	LocalModules.middlewarePutText,
	(_, res) => {
		res.json({ status: 200 });
	},
);

api.put(
	[
		'/header/icon',
		'/header/logo',
		'/propagandas/big-image',
		'/propagandas/small-image',
		'/products/image',
	],
	LocalModules.middlewareUploadFiles(1, 1),
	Middleware.middlewareCheckToken,
	LocalModules.middlewarePutImage,
	(_, res) => {
		res.json({ status: 200 });
	},
);

api.put(
	['/propagandas', '/categories', '/products'],
	Middleware.middlewareCheckToken,
	LocalModules.middlewarePutPosition,
	(_, res) => {
		res.json({ status: 200 });
	},
);

api.delete(
	'/propaganda',
	Middleware.middlewareCheckToken,
	LocalModules.middlewareDeletePropaganda,
	(_, res) => {
		res.json({ status: 200 });
	},
);

api.delete(
	'/category',
	Middleware.middlewareCheckToken,
	LocalModules.middlewareDeleteCategory,
	(_, res) => {
		res.json({ status: 200 });
	},
);

api.delete(
	'/product',
	Middleware.middlewareCheckToken,
	LocalModules.middlewareDeleteProduct,
	(_, res) => {
		res.json({ status: 200 });
	},
);

export default api;
