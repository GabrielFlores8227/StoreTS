import { GlobalMiddlewareModules, GlobalSqlModules } from '../globalModules';
import GlobalAdminModules from './globalAdminModules';
import { createHash, randomBytes } from 'crypto';
import express from 'express';

class InputMask {
	public static readonly textMask = {
		auth: {
			executeChecker: (body: { username: string; password: string }) => this.checkAuth(body),
		},
	};

	private static checkAuth(body: { username: string; password: string }) {
		return {
			username: typeof body.username === 'string' && body.username.length > 1,
			password: typeof body.password === 'string' && body.password.length > 1,
		};
	}
}

class LocalModulesUtil {
	public static validateDataForMiddlewarePostAdmin(body: { username: string; password: string }) {
		const checker = InputMask.textMask.auth.executeChecker(body);

		GlobalAdminModules.executeChecker(checker, {
			url: '/admin',
			status: 308,
		});
	}
}

export default class LocalModules {
	public static async middlewarePostAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			const body = req.body;

			LocalModulesUtil.validateDataForMiddlewarePostAdmin(body);

			const hashedUsername = createHash('sha512').update(String(body.username)).digest('hex');
			const hashedPassword = createHash('sha512').update(String(body.password)).digest('hex');

			const [query] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT username, password, token FROM auth WHERE id = ? AND username = ? AND password = ?', ['only', hashedUsername, hashedPassword]);

			if (Object(query).length !== 1) {
				return res.redirect('/admin?message=Oops! password or username is incorrect');
			}

			const newToken = randomBytes(128).toString('hex').substring(0, 255);

			await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'UPDATE auth SET token = ? WHERE id = ?', [newToken, 'only']);

			res.cookie('token', newToken);

			return next();
		} catch (err: any) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}
}
