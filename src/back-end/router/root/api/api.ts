import express from 'express';
import LocalModules from './localModules';

const api = express.Router();

api.get('/header', LocalModules.middlewareGetHeader, LocalModules.middlewareSendResponse);

api.get('/propagandas', LocalModules.middlewareGetPropagandas, LocalModules.middlewareSendResponse);

api.get('/products', LocalModules.middlewareGetProducts, LocalModules.middlewareSendResponse);

api.get('/footer', LocalModules.middlewareGetFooter, LocalModules.middlewareSendResponse);

api.get('/product/order/:id', LocalModules.middlewareOrderProduct, LocalModules.middlewareRedirect);

export default api;
