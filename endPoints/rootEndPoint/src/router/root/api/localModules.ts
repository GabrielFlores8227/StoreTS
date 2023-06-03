import express from 'express';
import Middleware from 'storets-middleware';
import Sql from 'storets-sql';

export default class LocalModules {
	public static async middlewareGetOrder(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			const id = req.params.id;

			const [query] = await Sql.query(
				'SELECT name, whatsapp, message FROM products WHERE id = ?;',
				[id!],
			);

			if (Object(query).length === 0) {
				Object(req).redirectTo = '/';
				return next();
			}

			await Middleware.addHistory('products', id!);

			Object(req).redirectTo =
				'https://api.whatsapp.com/send?phone=' +
				Object(query)[0].whatsapp +
				'&text=' +
				Object(query)[0].message.replace('###', Object(query)[0].name);

			return next();
		} catch (err) {
			Middleware.handleMiddlewareError(res, err);
		}
	}
}
