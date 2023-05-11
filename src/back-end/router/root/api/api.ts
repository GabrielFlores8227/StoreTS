import express from 'express';
import { GlobalMiddlewareModules } from '../../globalModules';
import LocalModules from './localModules';

const api = express.Router();

api.use(GlobalMiddlewareModules.apiLimiter);

//prettier-ignore
api.get('/header', 
	LocalModules.middlewareGetHeader,
	LocalModules.middlewareSendResponse
);

//prettier-ignore
api.get(
	"/propagandas",
	LocalModules.middlewareGetPropagandas,
	LocalModules.middlewareSendResponse
)

//prettier-ignore
api.get(
	"/categories",
	LocalModules.middlewareGetCategories,
	LocalModules.middlewareSendResponse
)

//prettier-ignore
api.get(
	"/products",
	LocalModules.middlewareGetProducts,
	LocalModules.middlewareSendResponse
)

//prettier-ignore
api.get(
	"/footer",
	LocalModules.middlewareGetFooter,
	LocalModules.middlewareSendResponse
)

export default api;
