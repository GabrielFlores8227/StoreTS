import express from 'express';
import crypto from 'crypto';
import Admin from 'storets-admin';
import Sql from 'storets-sql';
import Middleware from 'storets-middleware';
import util from 'util';

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
		Admin.checkLength(
			body.username,
			1,
			50,
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
		Admin.checkLength(
			body.password,
			1,
			50,
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
						'Oops, it seems that either the password or username is incorrect',
					redirect: true,
					url: '/admin/login',
				};
			}

			return next();
		} catch (err) {
			Middleware.handleMiddlewareError(res, err);
		}
	}

	/**
	 * Middleware function to check if a userId is stored in the session.
	 * If userId is not found, redirects the user to the login page.
	 * Otherwise, proceeds to the next middleware.
	 *
	 * @param req - The Express Request object.
	 * @param res - The Express Response object.
	 * @param next - The Express NextFunction to proceed to the next middleware.
	 * @returns Redirects the user to the login page if userId is not found, otherwise proceeds to the next middleware.
	 */
	public static async middlewareCheckUserId(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		if (!Object(req).session.userId) {
			return res.redirect('/admin/login');
		}

		return next();
	}

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

			await Sql.query('UPDATE admin SET token = ? WHERE id = ?', [
				newToken,
				'only',
			]);

			const currentDate = new Date();
			const futureDate = new Date();
			futureDate.setMinutes(currentDate.getMinutes() + 1);

			res.cookie('token', newToken, { expires: futureDate });

			return next();
		} catch (err) {
			Middleware.handleMiddlewareError(res, err);
		}
	}

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
