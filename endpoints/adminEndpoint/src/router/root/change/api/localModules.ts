import express from 'express';
import Admin from 'storets-admin';
import Middleware from 'storets-middleware';
import crypto from 'crypto';
import Sql from 'storets-sql';

class Support {
	/**
	 * Validates the data for the "putAuth" middleware.
	 * Checks the data types and length of the "from" and "to" parameters,
	 * and throws an error if the "from" and "to" values are the same.
	 *
	 * @param {string} from - The current value of the parameter.
	 * @param {string} to - The new value of the parameter.
	 * @param {string} confirm - The confirmed value of the parameter.
	 * @param {string} key - The key representing the parameter name.
	 * @throws {object} - Error object with status and message properties.
	 */
	public static async validateDataForMiddlewarePutAuth(
		from: string,
		to: string,
		confirm: string,
		key: string,
	) {
		Admin.checkType(from, 'string', `${key} atual`);

		const hashedFrom = crypto
			.createHash('sha512')
			.update(String(from))
			.digest('hex');

		const [query] = await Sql.query(
			'	SELECT `' + key + '` FROM `admin` WHERE `' + key + '` = ? AND `id` = ?;',
			[hashedFrom, 'only'],
		);

		if (Object(query).length === 0) {
			const message =
				key === 'username'
					? `Desculpe, o usuário fornecido está incorreto. Por favor, verifique os dados e tente novamente.`
					: `Desculpe, a senha fornecida está incorreta. Por favor, verifique os dados e tente novamente.`;

			throw {
				status: 400,
				message,
			};
		}

		Admin.checkType(
			to,
			'string',
			key === 'username' ? `novo usuário` : `nova senha`,
		);
		Admin.checkLength(
			to,
			5,
			30,
			key === 'username' ? `novo usuário` : `nova senha`,
		);
		Admin.checkType(confirm, 'string', `confirme ${key}`);

		if (from === to) {
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

		if (to !== confirm) {
			const message = `Desculpe, parece que o campo '${
				key === 'username' ? 'novo usuário' : 'nova senha'
			}' e '${
				key === 'username' ? 'confirme novo usuário' : 'confirme nova senha'
			}' não são iguais. Por favor, verifique os dados e tente novamente.`;

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
	 * @param {express.Request} req - The Express request object.
	 * @param {express.Response} res - The Express response object.
	 * @param {express.NextFunction} next - The next middleware function.
	 */
	public static async middlewarePutAuth(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			const { from, to, confirm } = req.body;
			const url = req.originalUrl.split('/');
			const column = String(url[url.length - 1]);

			await Support.validateDataForMiddlewarePutAuth(from, to, confirm, column);

			const hashedFrom = crypto
				.createHash('sha512')
				.update(String(from))
				.digest('hex');

			const hashedTo = crypto
				.createHash('sha512')
				.update(String(to))
				.digest('hex');

			await Sql.query(
				'UPDATE `admin` set `' + column + '` = ? WHERE `' + column + '` = ?;',
				[hashedTo, hashedFrom],
			);

			await Sql.query('DELETE FROM `sessions`;');

			return next();
		} catch (err) {
			Middleware.handleMiddlewareError(res, err);
		}
	}
}
