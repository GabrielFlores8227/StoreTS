import express from 'express';
import AdminApiMiddlewares from './adminApiMiddlewares';

const adminApi: express.Router = express.Router();

adminApi.post(
	'/post/propaganda',
	AdminApiMiddlewares.middlewareCheckToken,
	AdminApiMiddlewares.middlewareUploadFiles('files', 2),
	AdminApiMiddlewares.middlewarePostPropaganda,
	AdminApiMiddlewares.middlewareSendResponse(200),
);

adminApi.post(
	'/post/category',
	AdminApiMiddlewares.middlewareCheckToken,
	AdminApiMiddlewares.middlewarePostCategory,
	AdminApiMiddlewares.middlewareSendResponse(200),
);

adminApi.post(
	'/post/product',
	AdminApiMiddlewares.middlewareCheckToken,
	AdminApiMiddlewares.middlewareUploadFiles('files', 1),
	AdminApiMiddlewares.middlewarePostProduct,
	AdminApiMiddlewares.middlewareSendResponse(200),
);

adminApi.put(
	'/put/login',
	AdminApiMiddlewares.middlewareCheckToken,
	AdminApiMiddlewares.middlewarePutLogin,
	AdminApiMiddlewares.middlewareSendResponse(200),
);

adminApi.put(
	'/put/text',
	AdminApiMiddlewares.middlewareCheckToken,
	AdminApiMiddlewares.middlewarePutText,
	AdminApiMiddlewares.middlewareSendResponse(200),
);

adminApi.put(
	'/put/image',
	AdminApiMiddlewares.middlewareCheckToken,
	AdminApiMiddlewares.middlewareUploadFiles('files', 1),
	AdminApiMiddlewares.middlewarePutImage,
	AdminApiMiddlewares.middlewareSendResponse(200),
);

adminApi.put(
	'/put/position',
	AdminApiMiddlewares.middlewareCheckToken,
	AdminApiMiddlewares.middlewarePutPosition,
	AdminApiMiddlewares.middlewareSendResponse(200),
);

adminApi.delete(
	'/delete/propaganda',
	AdminApiMiddlewares.middlewareCheckToken,
	AdminApiMiddlewares.middlewareDeletePropaganda,
	AdminApiMiddlewares.middlewareSendResponse(200),
);

adminApi.delete(
	'/delete/category',
	AdminApiMiddlewares.middlewareCheckToken,
	AdminApiMiddlewares.middlewareDeleteCategory,
	AdminApiMiddlewares.middlewareSendResponse(200),
);

adminApi.delete(
	'/delete/product',
	AdminApiMiddlewares.middlewareCheckToken,
	AdminApiMiddlewares.middlewareDeleteProduct,
	AdminApiMiddlewares.middlewareSendResponse(200),
);

export default adminApi;
