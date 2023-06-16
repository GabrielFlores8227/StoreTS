import express from 'express';
import Middleware from 'storets-middleware';
import util from 'util';

export default class LocalModules {
	/**
	 * Middleware function to log out a user by destroying the session,
	 * and proceed to the next middleware.
	 *
	 * @param req - The Express Request object.
	 * @param res - The Express Response object.
	 * @param next - The Express NextFunction to proceed to the next middleware.
	 * @returns Destroys the session and proceeds to the next middleware.
	 * @throws {Error} If an error occurs during session destruction.
	 */
	public static async middlewareLogout(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			const destroySession = util
				.promisify(req.session.destroy)
				.bind(req.session);

			await destroySession();

			return next();
		} catch (err) {
			Middleware.handleMiddlewareError(res, err);
		}
	}
}
