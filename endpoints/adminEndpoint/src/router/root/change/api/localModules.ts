import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import Admin from 'storets-admin';
import Middleware from 'storets-middleware';
import Sql from 'storets-sql';

class Support {
	/**
	 * Validates the data for the "putAuth" middleware.
	 * Checks the data types and length of the "from" and "to" parameters,
	 * and throws an error if the "from" and "to" values are the same.
	 *
	 * @param {string} change - The current value of the parameter.
	 * @param {string} confirm - The new value of the parameter.
	 * @param {string} password - The confirmed password of the parameter.
	 * @param {string} key - The key representing the parameter name.
	 * @throws {object} - Error object with status and message properties.
	 */
	public static async validateDataForMiddlewarePutAuth(
		change: string,
		confirm: string,
		password: string,
		key: string,
	) {
		Admin.checkType(password, 'string', 'senha');

		const hashedPassword = createHash('sha512')
			.update(String(password))
			.digest('hex');

		const [query] = await Sql.query(
			'	SELECT `username`, `password` FROM `admin` WHERE `password` = ? AND `id` = ?;',
			[hashedPassword, 'only'],
		);

		if (Object(query).length === 0) {
			throw {
				status: 400,
				message:
					'Desculpe, a senha fornecida está incorreta. Por favor, verifique os dados e tente novamente.',
			};
		}
		Admin.checkType(
			change,
			'string',
			key === 'username' ? `novo usuário` : `nova senha`,
		);
		Admin.checkLength(
			change,
			5,
			30,
			key === 'username' ? `novo usuário` : `nova senha`,
		);
		Admin.checkType(confirm, 'string', `confirme ${key}`);

		const hashedChange = createHash('sha512')
			.update(String(change))
			.digest('hex');

		if (hashedChange === Object(query)[0][key]) {
			const message = `Por favor, forneça ${
				key === 'username'
					? 'um novo usuário diferente do usuário atual'
					: 'uma nova senha diferente da senha atual'
			}.`;

			throw {
				status: 400,
				message,
			};
		}

		if (change !== confirm) {
			const message = `Desculpe, parece que o campo confirme '${
				key === 'username' ? 'novo usuário' : 'nova senha'
			}' está incorreto. Por favor, verifique os dados e tente novamente.`;

			throw {
				status: 400,
				message,
			};
		}
	}
}

export default class LocalModules {
	/**
	 * Middleware function for handling the "putAuth" route.
	 * Validates the data received in the request body, updates the specified column in the "admin" table,
	 * and deletes all sessions.
	 *
	 * @param {Request} req - The Express request object.
	 * @param {Response} res - The Express response object.
	 * @param {NextFunction} next - The next middleware function.
	 */
	public static async middlewarePutAuth(
		req: Request,
		res: Response,
		next: NextFunction,
	) {
		try {
			const { change, confirm, password } = req.body;
			const url = req.originalUrl.split('/');
			const column = String(url[url.length - 1]);

			await Support.validateDataForMiddlewarePutAuth(
				change,
				confirm,
				password,
				column,
			);

			const hashedPassword = createHash('sha512')
				.update(String(password))
				.digest('hex');

			const hashedChange = createHash('sha512')
				.update(String(change))
				.digest('hex');

			await Sql.query(
				'UPDATE `admin` set `' + column + '` = ? WHERE `password` = ?;',
				[hashedChange, hashedPassword],
			);

			await Sql.query('DELETE FROM `sessions`;');

			return next();
		} catch (err) {
			Middleware.handleMiddlewareError(res, err);
		}
	}
}
