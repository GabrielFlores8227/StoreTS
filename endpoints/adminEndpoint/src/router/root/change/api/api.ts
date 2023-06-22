import express from 'express';
import Middleware from 'storets-middleware';
import LocalModules from './localModules';

const api = express.Router();

api.put(
	['/username', '/password'],
	Middleware.middlewareCheckToken,
	LocalModules.middlewarePutAuth,
	(_, res) => {
		res.json({ status: 200 });
	},
);

export default api;
