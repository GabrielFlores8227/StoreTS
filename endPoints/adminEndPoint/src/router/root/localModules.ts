import express from 'express';
import {
	GlobalMiddlewareModules,
	GlobalMySQLModules,
} from '../../globalModules';
import crypto from 'crypto';

class Mask {
	public static checkLength(
		data: any,
		minLength: number,
		maxLength: number,
		key: string,
		redirect?: boolean,
		url?: string,
	) {
		if (data.length < minLength || data.length > maxLength) {
			const error: any = {
				status: 401,
				message:
					'Please provide the ' + key + ' correctly to fulfill the request',
			};

			if (redirect && url) {
				error.redirect = redirect;
				error.url = url;
			}

			throw error;
		}
	}

	public static checkType(
		data: any,
		type: string,
		key: string,
		redirect?: boolean,
		url?: string,
	) {
		if (typeof data !== type) {
			const error: any = {
				status: 401,
				message:
					'Please provide the ' + key + ' correctly to fulfill the request',
			};

			if (redirect && url) {
				error.redirect = redirect;
				error.url = url;
			}

			throw error;
		}
	}
}

class Support {
	public static middlewareCheckAuthSupport(body: {
		username: string;
		password: string;
	}) {
		Mask.checkType(body.username, 'string', 'username', true, '/admin');
		Mask.checkLength(body.username, 1, 50, 'username', true, '/admin');

		Mask.checkType(body.password, 'string', 'password', true, '/admin');
		Mask.checkLength(body.password, 1, 50, 'password', true, '/admin');
	}
}

export default class LocalModules {
	public static async middlewareCheckAuth(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			Support.middlewareCheckAuthSupport(req.body);

			const hashedUsername = crypto
				.createHash('sha512')
				.update(String(req.body.username))
				.digest('hex');
			const hashedPassword = crypto
				.createHash('sha512')
				.update(String(req.body.password))
				.digest('hex');

			const [query] = await GlobalMySQLModules.query(
				'SELECT username, password, token FROM admin WHERE id = ? AND username = ? AND password = ?',
				['only', hashedUsername, hashedPassword],
			);

			if (Object(query).length === 0) {
				throw {
					status: 401,
					message:
						'Oops, it seems that either the password or username is incorrect.',
					redirect: true,
					url: '/admin',
				};
			}

			const newToken = crypto
				.randomBytes(128)
				.toString('hex')
				.substring(0, 255);

			await GlobalMySQLModules.query(
				'UPDATE admin SET token = ? WHERE id = ?',
				[newToken, 'only'],
			);

			res.cookie('token', newToken);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}
}
