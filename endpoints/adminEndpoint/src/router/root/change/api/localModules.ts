import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import Admin from 'storets-admin';
import Middleware from 'storets-middleware';
import Sql from 'storets-sql';

class Mask {
	public static readonly textMask = {
		admin: {
			'username-&-password': async (
				change: string,
				confirm: string,
				password: string,
				key: string,
			) => {
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

				Admin.checkLength(
					confirm,
					5,
					30,
					key === 'username' ? `confirme novo usuário` : `confirme nova senha`,
				);

				Admin.checkType(password, 'string', 'senha');

				const [query] = await Sql.query(
					'	SELECT `username`, `password` FROM `admin` WHERE `id` = ?;',
					['only'],
				);

				if (await bcrypt.compare(change, Object(query)[0][key])) {
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
					const message = `Desculpe, parece que o campo '${
						key === 'username' ? 'confirme novo usuário' : 'confirme nova senha'
					}' está incorreto. Por favor, verifique os dados e tente novamente.`;

					throw {
						status: 400,
						message,
					};
				}

				if (
					Object(query).length === 0 ||
					!(await bcrypt.compare(password, Object(query)[0].password))
				) {
					throw {
						status: 400,
						message:
							'Desculpe, a senha fornecida está incorreta. Por favor, verifique os dados e tente novamente.',
					};
				}
			},
		},
	};
}

class Support {
	/**
	 * Validates data before processing an authenticated middleware PUT operation.
	 * @param {string} change - The new username or password to be changed to.
	 * @param {string} confirm - The confirmation of the new username or password.
	 * @param {string} password - The current password for authentication.
	 * @param {string} key - The authentication key to authorize the PUT operation.
	 */
	public static async validateDataForMiddlewarePutUsernameAndPassword(
		change: string,
		confirm: string,
		password: string,
		key: string,
	) {
		await Mask.textMask.admin['username-&-password'](
			change,
			confirm,
			password,
			key,
		);
	}
}

export default class LocalModules {
	/**
	 * Middleware function for handling the "putAuth" route.
	 * Validates the data received in the request body, updates the specified column in the "admin" table,
	 * and deletes all sessions except the current session.
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

			await Support.validateDataForMiddlewarePutUsernameAndPassword(
				change,
				confirm,
				password,
				column,
			);

			const hashedChange = await bcrypt.hash(
				change,
				Number(process.env.SALT_FACTOR!),
			);

			await Sql.query(
				'UPDATE `admin` set `' + column + '` = ? WHERE `id` = ?;',
				[hashedChange, 'only'],
			);

			await Sql.query('DELETE FROM `sessions` where `session_id` != ?;', [
				Object(req).session.sessionID,
			]);

			return next();
		} catch (err) {
			Middleware.handleMiddlewareError(res, err);
		}
	}
}
