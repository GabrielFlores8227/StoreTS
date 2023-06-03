import express from 'express';
import crypto from 'crypto';
import Admin from 'storets-admin';
import Sql from 'storets-sql';
import Middleware from 'storets-middleware';

class Support {
	public static validateDataForMiddlewareCheckAuth(body: {
		username: string;
		password: string;
	}) {
		Admin.checkType(body.username, 'string', 'username', 401, true, '/admin');

		Admin.checkLength(body.username, 1, 50, 'username', 401, true, '/admin');

		Admin.checkType(body.password, 'string', 'password', 401, true, '/admin');

		Admin.checkLength(body.password, 1, 50, 'password', 401, true, '/admin');
	}
}

export default class LocalModules {
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
					url: '/admin',
				};
			}

			const newToken = crypto
				.randomBytes(128)
				.toString('hex')
				.substring(0, 255);

			await Sql.query('UPDATE admin SET token = ? WHERE id = ?', [
				newToken,
				'only',
			]);

			res.cookie('token', newToken);

			return next();
		} catch (err) {
			Middleware.handleMiddlewareError(res, err);
		}
	}
}
