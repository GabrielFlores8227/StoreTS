import express from 'express';
import crypto from 'crypto';
import Sql from 'storets-sql';
import Middleware from 'storets-middleware';

export default class LocalModules {
	/**
	 * Middleware function to generate a token, update it in the database,
	 * set it as a cookie in the response, and proceed to the next middleware.
	 *
	 * @param _ - The Express Request object (unused parameter).
	 * @param res - The Express Response object.
	 * @param next - The Express NextFunction to proceed to the next middleware.
	 * @returns Sets the token as a cookie in the response and proceeds to the next middleware.
	 * @throws {Error} If an error occurs during token generation or database update.
	 */
	public static async middlewareGenerateToken(
		_: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			const newToken = crypto
				.randomBytes(128)
				.toString('hex')
				.substring(0, 255);

			await Sql.query('UPDATE `admin` SET `token` = ? WHERE `id` = ?', [
				newToken,
				'only',
			]);

			const currentDate = new Date();
			const futureDate = new Date();
			futureDate.setMinutes(currentDate.getMinutes() + 1);

			res.cookie('token', newToken, {
				expires: futureDate,
				sameSite: 'strict',
			});

			return next();
		} catch (err) {
			Middleware.handleMiddlewareError(res, err);
		}
	}
}
