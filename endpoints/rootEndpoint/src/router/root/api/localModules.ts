import { Request, Response, NextFunction } from 'express';
import Middleware from 'storets-middleware';
import Sql from 'storets-sql';

export default class LocalModules {
	/**
	 * Middleware function for handling GET requests to the order endpoint.
	 * Retrieves information from the 'products' table based on the provided ID.
	 * Adds a history entry for the 'products' resource with the specified ID.
	 * Sets the redirection URL to a WhatsApp API link for ordering the product.
	 *
	 * @param {Request} req - The request object.
	 * @param {Response} res - The response object.
	 * @param {NextFunction} next - The next function.
	 */
	public static async middlewareGetOrder(
		req: Request,
		res: Response,
		next: NextFunction,
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

			Object(req).redirectTo = `https://api.whatsapp.com/send?phone=${
				Object(query)[0].whatsapp
			}&text=${Object(query)[0].message.replace('###', Object(query)[0].name)}`;

			return next();
		} catch (err) {
			Middleware.handleMiddlewareError(res, err);
		}
	}
}
