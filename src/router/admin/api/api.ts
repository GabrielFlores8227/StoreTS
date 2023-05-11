import express from 'express';
import { GlobalMiddlewareModules } from '../../globalModules';
import LocalModules from './localModules';

const api: express.Router = express.Router();

api.use(GlobalMiddlewareModules.apiLimiter);

//prettier-ignore
api.post(
	'/propaganda', 
	LocalModules.middlewareUploadFiles(2, 2), 
	LocalModules.middlewareCheckAuth, 
	LocalModules.middlewarePostPropaganda, 
	LocalModules.middlewareSendResponse(200)
);

//prettier-ignore
api.delete(
	'/propaganda', 
	LocalModules.middlewareCheckAuth, 
	LocalModules.middlewareDeletePropaganda, 
	LocalModules.middlewareSendResponse(200)
);

//prettier-ignore
api.post(
	'/category', 
	LocalModules.middlewareCheckAuth, 
	LocalModules.middlewarePostCategory, 
	LocalModules.middlewareSendResponse(200));

//prettier-ignore
api.delete(
	'/category', 
	LocalModules.middlewareCheckAuth, 
	LocalModules.middlewareDeleteCategory, 
	LocalModules.middlewareSendResponse(200)
);

//prettier-ignore
api.post(
	'/product', 
	LocalModules.middlewareUploadFiles(1, 1), 
	LocalModules.middlewareCheckAuth, 
	LocalModules.middlewarePostProduct, 
	LocalModules.middlewareSendResponse(200)
);

//prettier-ignore
api.delete(
	'/product', 
	LocalModules.middlewareCheckAuth, 
	LocalModules.middlewareDeleteProduct, 
	LocalModules.middlewareSendResponse(200)
);

//prettier-ignore
api.put(
	[
		'/header/title', '/header/description', '/header/color',
		'/categories/name',
		'/products/category', '/products/name', '/products/price', '/products/off', '/products/installment', 'products/whatsapp', '/products/message',
		'/footer/title', '/footer/text'
	], 
	LocalModules.middlewareCheckAuth, 
	LocalModules.middlewarePutText, 
	LocalModules.middlewareSendResponse(200)
)

//prettier-ignore
api.put(
	[
		'/header/icon', '/header/logo',
		'/propagandas/bigImage', '/propagandas/smallImage',
		'/products/image'
	],
	LocalModules.middlewareUploadFiles(1, 1), 
	LocalModules.middlewareCheckAuth, 
	LocalModules.middlewarePutImage,
	LocalModules.middlewareSendResponse(200)
)

//prettier-ignore
api.put(
	[
		'/categories',
		'/propagandas',
		'/products'
	],
	LocalModules.middlewareCheckAuth,
	LocalModules.middlewarePutPosition,
	LocalModules.middlewareSendResponse(200)
)

export default api;
