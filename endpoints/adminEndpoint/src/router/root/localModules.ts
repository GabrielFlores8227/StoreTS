import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import Sql from 'storets-sql';
import Middleware from 'storets-middleware';

export default class LocalModules {
	/**
	 * Middleware function to generate a token, update it in the database,
	 * set it as a cookie in the response, and proceed to the next middleware.
	 *
	 * @param {Request} _ - The Express Request object (unused parameter).
	 * @param {Response} res - The Express Response object.
	 * @param {NextFunction} next - The Express NextFunction to proceed to the next middleware.
	 * @returns Sets the token as a cookie in the response and proceeds to the next middleware.
	 * @throws {Error} If an error occurs during token generation or database update.
	 */
	public static async middlewareGenerateToken(
		_: Request,
		res: Response,
		next: NextFunction,
	) {
		try {
			const newToken = randomBytes(128).toString('hex').substring(0, 255);

			await Sql.query('UPDATE `admin` SET `token` = ? WHERE `id` = ?;', [
				newToken,
				'only',
			]);

			const expires = new Date();
			expires.setMinutes(new Date().getMinutes() + 1);

			res.cookie('token', newToken, {
				expires,
				sameSite: 'strict',
			});

			return next();
		} catch (err) {
			Middleware.handleMiddlewareError(res, err);
		}
	}
}
