import express from 'express';
import Middleware from 'storets-middleware';
import { rateLimit } from 'express-rate-limit';
import LocalModules from './localModules';

const api = express.Router();

api.put(
	['/username', '/password'],
	rateLimit({
		windowMs: 20 * 60 * 1000,
		max: 30,
		handler: (_, res) => {
			res.status(429).json({
				status: 429,
				message:
					'Devido ao número máximo de pedidos ser atingido, a ação de atualizar o login será bloqueada temporariamente por alguns minutos neste dispositivo.',
			});
		},
	}),
	Middleware.middlewareCheckToken,
	LocalModules.middlewarePutAuth,
	(_, res) => {
		res.json({ status: 200 });
	},
);

export default api;
