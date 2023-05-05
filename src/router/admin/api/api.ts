import express from 'express';
import ApiModules from './apiModules';

const api: express.Router = express.Router();

api.post('/post/propaganda', ApiModules.middlewareUploadFiles('files', 2), ApiModules.middlewareCheckToken, ApiModules.middlewarePostPropaganda, ApiModules.middlewareSendResponse(200));

api.post('/post/category', ApiModules.middlewareCheckToken, ApiModules.middlewarePostCategory, ApiModules.middlewareSendResponse(200));

api.post('/post/product', ApiModules.middlewareUploadFiles('files', 1), ApiModules.middlewareCheckToken, ApiModules.middlewarePostProduct, ApiModules.middlewareSendResponse(200));

api.put('/put/login', ApiModules.middlewareCheckToken, ApiModules.middlewarePutLogin, ApiModules.middlewareSendResponse(200));

api.put('/put/text', ApiModules.middlewareCheckToken, ApiModules.middlewarePutText, ApiModules.middlewareSendResponse(200));

api.put('/put/image', ApiModules.middlewareUploadFiles('files', 1), ApiModules.middlewareCheckToken, ApiModules.middlewarePutImage, ApiModules.middlewareSendResponse(200));

api.put('/put/position', ApiModules.middlewareCheckToken, ApiModules.middlewarePutPosition, ApiModules.middlewareSendResponse(200));

api.delete('/delete/propaganda', ApiModules.middlewareCheckToken, ApiModules.middlewareDeletePropaganda, ApiModules.middlewareSendResponse(200));

api.delete('/delete/category', ApiModules.middlewareCheckToken, ApiModules.middlewareDeleteCategory, ApiModules.middlewareSendResponse(200));

api.delete('/delete/product', ApiModules.middlewareCheckToken, ApiModules.middlewareDeleteProduct, ApiModules.middlewareSendResponse(200));

export default api;
