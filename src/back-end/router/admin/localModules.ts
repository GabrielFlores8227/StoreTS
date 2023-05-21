import { GlobalMiddlewareModules, GlobalSqlModules } from '../globalModules';
import { createHash, randomBytes } from 'crypto';
import express from 'express';

export default class LocalModules {
	public static async middlewarePostAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			const body = req.body;

			const hashedUsername = createHash('sha512').update(String(body.username)).digest('hex');
			const hashedPassword = createHash('sha512').update(String(body.password)).digest('hex');

			const [query] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT username, password, token FROM auth WHERE id = ? AND username = ? AND password = ?', ['only', hashedUsername, hashedPassword]);

			if (Object(query).length !== 1) {
				return res.redirect('/admin?message=Oops! password or username is incorrect.');
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
