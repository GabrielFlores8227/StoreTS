import express from 'express';
import {
	GlobalMiddlewareModules,
	GlobalMySQLModules,
} from '../../../globalModules';

export default class LocalModules {
	public static async middlewareGetOrder(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			const id = req.params.id;

			const [query] = await GlobalMySQLModules.query(
				'SELECT name, whatsapp, message, clicks FROM products WHERE id = ?;',
				[id!],
			);

			if (Object(query).length === 0) {
				Object(req).redirectTo = '/';
				return next();
			}

			let clicks = Object(query)[0].clicks;

			if (!clicks) {
				clicks = [];
			}

			clicks.push(new Date());

			await GlobalMySQLModules.query(
				'UPDATE products SET clicks = ? WHERE id = ?',
				[JSON.stringify(clicks), id!],
			);

			Object(req).redirectTo =
				'https://api.whatsapp.com/send?phone=' +
				Object(query)[0].whatsapp +
				'&text=' +
				Object(query)[0].message.replace('###', Object(query)[0].name);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}
}
