import express from 'express';
import AdminModules from '../adminModules';
import {
	GlobalMiddlewareModules,
	GlobalMySQLModules,
} from '../../../globalModules';

class Support {
	public static readonly mask = {
		header: {
			title: (data: string, column: string) => {
				AdminModules.checkLength(data, 5, 50, column);
			},
			description: (data: string, column: string) => {
				AdminModules.checkLength(data, 5, 255, column);
			},
			color: (data: string, column: string) => {
				AdminModules.checkLength(data, 7, 7, column);
			},
		},
		categories: {
			name: (data: string, column: string) => {
				AdminModules.checkLength(data, 5, 50, column);
			},
		},
		products: {
			name: (data: string, column: string) => {
				AdminModules.checkLength(data, 5, 50, column);
			},
			price: (data: string, column: string) => {
				AdminModules.checkNumber(data, column);
				AdminModules.checkValue(data, 0, 999999999999999, column);
			},
			off: (data: string, column: string) => {
				AdminModules.checkNumber(data, column);
				AdminModules.checkValue(data, 0, 100, column);
			},
			installment: (data: string, column: string) => {
				AdminModules.checkLength(data, 0, 50, column);
			},
			whatsapp: (data: string, column: string) => {
				AdminModules.checkNumber(data, column);
				AdminModules.checkLength(data, 13, 13, column);
			},
			message: (data: string, column: string) => {
				AdminModules.checkLength(data, 0, 255, column);
			},
		},
		footer: {
			title: (data: string, column: string) => {
				AdminModules.checkLength(data, 5, 50, column);
			},
			text: (data: string, column: string) => {
				AdminModules.checkLength(data, 5, 255, column);
			},
			whatsapp: (data: string, column: string) => {
				AdminModules.checkNumber(data, column);
				AdminModules.checkLength(data, 13, 13, column);
			},
			facebook: (data: string, column: string) => {
				AdminModules.checkLength(data, 5, 50, column);
			},
			instagram: (data: string, column: string) => {
				AdminModules.checkLength(data, 5, 50, column);
			},
			storeInfo: (data: string, column: string) => {
				AdminModules.checkLength(data, 5, 50, column);
			},
			completeStoreInfo: (data: string, column: string) => {
				AdminModules.checkLength(data, 5, 50, column);
			},
		},
	};

	public static validateDataForMiddlewarePutText(
		id: string,
		data: string,
		column: string,
		table: string,
	) {
		AdminModules.checkType(id, 'string', 'id');

		AdminModules.checkType(data, 'string', column);

		Object(Support.mask)[table][column](data, column);
	}
}

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

	public static async middlewarePutText(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			const url = req.originalUrl.split('/');
			const table = String(url[4]);
			const column = String(url[5]);
			const data = req.body[column];

			Support.validateDataForMiddlewarePutText(
				req.body.id,
				data,
				column,
				table,
			);

			await GlobalMySQLModules.query(
				'UPDATE ' + table + ' SET ' + column + ' = ? WHERE id = ?;',
				[data, req.body.id],
			);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}
}
