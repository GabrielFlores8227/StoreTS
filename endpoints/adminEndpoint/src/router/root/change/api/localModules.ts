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
	public static validateDataForMiddlewarePutAuth(
		from: string,
		to: string,
		confirm: string,
		key: string,
	) {
		Admin.checkType(from, 'string', `${key} atual`);
		Admin.checkType(
			to,
			'string',
			key === 'usuário' ? `Novo ${key}` : `nova ${key}`,
		);
		Admin.checkLength(
			to,
			5,
			30,
			key === 'usuário' ? `Novo ${key}` : `nova ${key}`,
		);
		Admin.checkType(confirm, 'string', `confirme ${key}`);

		if (from === to) {
			const message = `Por favor, forneça ${
				key === 'usuário'
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
				key === 'usuário' ? 'novo usuário' : 'nova senha'
			}' e '${
				key === 'usuário' ? 'confirme novo usuário' : 'confirme nova senha'
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
	 * Middleware function to update authentication credentials.
	 * Validates the request body, hashes the current and new values,
	 * performs a database update query, clears all sessions,
	 * and calls the next middleware.
	 *
	 * @param {express.Request} req - The Express request object.
	 * @param {express.Response} res - The Express response object.
	 * @param {express.NextFunction} next - The Express next function.
	 */
	public static async middlewarePutAuth(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			const { from, to, confirm } = req.body;
			const url = req.originalUrl.split('/');
			const column = url[url.length - 1];
			const key = column === 'username' ? 'usuário' : 'senha';

			Support.validateDataForMiddlewarePutAuth(from, to, confirm, key);

			const hashedFrom = crypto
				.createHash('sha512')
				.update(String(from))
				.digest('hex');

			const hashedTo = crypto
				.createHash('sha512')
				.update(String(to))
				.digest('hex');

			const [query] = await Sql.query(
				'UPDATE `admin` set `' + column + '` = ? WHERE `' + column + '` = ?;',
				[hashedTo, hashedFrom],
			);

			if (Object(query).affectedRows === 0) {
				const message =
					key === 'usuário'
						? `Desculpe, o ${key} fornecido está incorreto. Por favor, verifique os dados e tente novamente.`
						: `Desculpe, a ${key} fornecida está incorreta. Por favor, verifique os dados e tente novamente.`;

				throw {
					status: 400,
					message,
				};
			}

			await Sql.query('DELETE FROM `sessions`;');

			return next();
		} catch (err) {
			Middleware.handleMiddlewareError(res, err);
		}
	}
}
