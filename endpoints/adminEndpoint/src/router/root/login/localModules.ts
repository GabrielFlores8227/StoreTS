import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import Middleware from 'storets-middleware';
import Admin from 'storets-admin';
import Sql from 'storets-sql';

class Support {
	/**
	 * Validates the data for the middleware check authentication.
	 *
	 * @param body - The request body containing the username and password.
	 * @throws {Error} If the data is invalid, it throws an error with the appropriate status code and redirection URL.
	 */
	public static validateDataForMiddlewareCheckAuth(
		username: string,
		password: string,
	) {
		Admin.checkType(username, 'string', 'username', 401, true, '/admin/login');
		Admin.checkType(password, 'string', 'password', 401, true, '/admin/login');
	}
}

export default class LocalModules {
	/**
	 * Middleware function for authentication check.
	 * Validates the request body, hashes the username and password,
	 * performs a database query to check the credentials,
	 * generates a new token, updates the token in the database,
	 * sets the token as a cookie in the response, and calls the next middleware.
	 *
	 * @param {Request} req - The Express request object.
	 * @param {Response} res - The Express response object.
	 * @param {NextFunction} next - The Express next function.
	 */
	public static async middlewareCheckAuth(
		req: Request,
		res: Response,
		next: NextFunction,
	) {
		try {
			const { username, password } = req.body;

			Support.validateDataForMiddlewareCheckAuth(username, password);

			const hashedUsername = createHash('sha512')
				.update(String(username))
				.digest('hex');
			const hashedPassword = createHash('sha512')
				.update(String(password))
				.digest('hex');

			const [query] = await Sql.query(
				'SELECT `username`, `password`, `token` FROM `admin` WHERE `id` = ? AND `username` = ? AND `password` = ?;',
				['only', hashedUsername, hashedPassword],
			);

			if (Object(query).length === 0) {
				throw {
					status: 401,
					message:
						'Desculpe, parece que a senha ou o nome de usuário está incorreto.',
					redirect: true,
					url: '/admin/login',
				};
			}

			return next();
		} catch (err) {
			Middleware.handleMiddlewareError(res, err);
		}
	}
}
