import express from 'express';
import Middleware from 'storets-middleware';
import Sql from 'storets-sql';

export default class LocalModules {
	/**
	 * Middleware function to get the token.
	 * Retrieves the token from the database based on the admin ID,
	 * sets the token as a cookie in the response, and calls the next middleware.
	 *
	 * @param {express.Request} _ - The Express request object.
	 * @param {express.Response} res - The Express response object.
	 * @param {express.NextFunction} next - The Express next function.
	 */
	public static async middlewareGetToken(
		_: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			const [query] = await Sql.query(
				'SELECT `token` FROM `admin` WHERE `id` = ?;',
				['only'],
			);

			const token = Object(query)[0].token;

			const expires = new Date();
			expires.setMinutes(new Date().getMinutes() + 1);

			res.cookie('token', token, {
				expires,
				sameSite: 'strict',
			});

			return next();
		} catch (err) {
			Middleware.handleMiddlewareError(res, err);
		}
	}
}
