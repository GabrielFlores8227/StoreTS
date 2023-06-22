import { Request, Response, NextFunction } from 'express';
import Middleware from 'storets-middleware';

export default class LocalModules {
	/**
	 * Middleware function for handling GET requests to the root endpoint.
	 * Adds a history entry for the 'website' resource.
	 *
	 * @param {Request} _ - The request object.
	 * @param {Response} res - The response object.
	 * @param {NextFunction} next - The next function.
	 */
	public static async middlewareGetRoot(
		_: Request,
		res: Response,
		next: NextFunction,
	) {
		try {
			await Middleware.addHistory('website', 'only');

			return next();
		} catch (err) {
			Middleware.handleMiddlewareError(res, err);
		}
	}
}
