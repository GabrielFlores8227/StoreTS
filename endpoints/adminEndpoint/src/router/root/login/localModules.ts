import express from 'express';
import Middleware from 'storets-middleware';
import Admin from 'storets-admin';
import Sql from 'storets-sql';
import crypto from 'crypto';

class Support {
	/**
	 * Validates the data for the middleware check authentication.
	 *
	 * @param body - The request body containing the username and password.
	 * @throws {Error} If the data is invalid, it throws an error with the appropriate status code and redirection URL.
	 */
	public static validateDataForMiddlewareCheckAuth(body: {
		username: string;
		password: string;
	}) {
		Admin.checkType(
			body.username,
			'string',
			'username',
			401,
			true,
			'/admin/login',
		);
		Admin.checkType(
			body.password,
			'string',
			'password',
			401,
			true,
			'/admin/login',
		);
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
	 * @param {express.Request} req - The Express request object.
	 * @param {express.Response} res - The Express response object.
	 * @param {express.NextFunction} next - The Express next function.
	 */
	public static async middlewareCheckAuth(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			Support.validateDataForMiddlewareCheckAuth(req.body);

			const hashedUsername = crypto
				.createHash('sha512')
				.update(String(req.body.username))
				.digest('hex');
			const hashedPassword = crypto
				.createHash('sha512')
				.update(String(req.body.password))
				.digest('hex');

			const [query] = await Sql.query(
				'SELECT username, password, token FROM admin WHERE id = ? AND username = ? AND password = ?',
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
