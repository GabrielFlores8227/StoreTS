import express from 'express';
import AdminModules from '../adminModules';
import {
	GlobalMiddlewareModules,
	GlobalMySQLModules,
} from '../../../globalModules';

export default class LocalModules {
	public static async middlewareCheckToken(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			AdminModules.checkType(
				req.headers.authorization,
				'string',
				'authorization',
				true,
			);

			req.headers.authorization = req.headers.authorization!.replace(
				'Bearer ',
				'',
			);

			const [query] = await GlobalMySQLModules.query(
				'SELECT token FROM admin WHERE token = ?;',
				[req.headers.authorization!],
			);

			if (Object(query).length === 0) {
				throw {
					status: 401,
					message: 'unthorized',
				};
			}

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}
}
