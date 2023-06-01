import express from 'express';
import { GlobalMiddlewareModules } from '../../globalModules';

export default class LocalModules {
	public static async middlewareGetRoot(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			await GlobalMiddlewareModules.addHistory('website', 'only');

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}
}
