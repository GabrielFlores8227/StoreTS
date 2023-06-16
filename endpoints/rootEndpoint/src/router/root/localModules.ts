import express from 'express';
import Middleware from 'storets-middleware';

export default class LocalModules {
	/**
	 * Middleware function for handling GET requests to the root endpoint.
	 * Adds a history entry for the 'website' resource.
	 *
	 * @param {express.Request} _ - The request object.
	 * @param {express.Response} res - The response object.
	 * @param {express.NextFunction} next - The next function.
	 */
	public static async middlewareGetRoot(
		_: express.Request,
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
