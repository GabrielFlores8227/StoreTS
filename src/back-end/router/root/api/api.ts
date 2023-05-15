import express from 'express';
import LocalModules from './localModules';

const api = express.Router();

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

//prettier-ignore
api.get(
	"/product/order/:id",
	LocalModules.middlewareGetProduct,
	LocalModules.middlewareRedirect
)

export default api;
