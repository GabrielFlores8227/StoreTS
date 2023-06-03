import express from 'express';
import Middleware from 'storets-middleware';

export default class LocalModules {
	public static async middlewareGetRoot(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			await Middleware.addHistory('website', 'only');

			return next();
		} catch (err) {
			Middleware.handleMiddlewareError(res, err);
		}
	}
}
