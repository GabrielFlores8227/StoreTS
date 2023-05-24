import express from 'express';
import { GlobalSqlModules, GlobalS3Modules, GlobalMiddlewareModules } from '../../globalModules';

export default class LocalModules {
	/**
	 * Middleware function to get the header information from the database and generate signed URLs for the header icon and logo.
	 * The retrieved header information is attached to the request object as 'req.sendResponse'.
	 * If an error occurs, it is handled using the global error handling middleware.
	 */
	public static async middlewareGetHeader(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			const [query] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlOrdinaryConn, 'SELECT icon, logo, title, description, color FROM header WHERE id = ?;', ['only']);

			Object(query)[0].icon = await GlobalS3Modules.generateSignedUrlForS3BucketFile(Object(query)[0].icon);
			Object(query)[0].logo = await GlobalS3Modules.generateSignedUrlForS3BucketFile(Object(query)[0].logo);

			Object(req).sendResponse = Object(query)[0];

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	/**
	 * Middleware function to get the propaganda images from the database and generate signed URLs for them.
	 * The retrieved propaganda images are attached to the request object as 'req.sendResponse'.
	 * If an error occurs, it is handled using the global error handling middleware.
	 */
	public static async middlewareGetPropagandas(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			const [query] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlOrdinaryConn, 'SELECT bigImage, smallImage FROM propagandas ORDER BY position;');

			for (let c = 0; c < Object(query).length; c++) {
				Object(query)[c].bigImage = await GlobalS3Modules.generateSignedUrlForS3BucketFile(Object(query)[c].bigImage);
				Object(query)[c].smallImage = await GlobalS3Modules.generateSignedUrlForS3BucketFile(Object(query)[c].smallImage);
			}

			Object(req).sendResponse = query;

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	/**
	 * Middleware function to get the products from the database categorized by categories.
	 * The retrieved products are attached to the request object as 'req.sendResponse'.
	 * If an error occurs, it is handled using the global error handling middleware.
	 */
	public static async middlewareGetProducts(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			const [query1] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlOrdinaryConn, 'SELECT id, name FROM categories ORDER BY position;');

			const sendResponse = {};

			for (let c = 0; c < Object(query1).length; c++) {
				const [query2] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlOrdinaryConn, 'SELECT id, name, image, price, off, installment FROM products WHERE category = ? ORDER BY position;', [Object(query1)[c].id]);

				for (let i = 0; i < Object(query2).length; i++) {
					Object(query2)[i].image = await GlobalS3Modules.generateSignedUrlForS3BucketFile(Object(query2)[i].image);

					if (!Object(sendResponse)[Object(query1)[c].name]) {
						Object(sendResponse)[Object(query1)[c].name] = [];
					}

					Object(sendResponse)[Object(query1)[c].name].push(Object(query2)[i]);
				}
			}

			Object(req).sendResponse = sendResponse;

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	/**
	 * Middleware function to get the footer information from the database.
	 * The retrieved footer data is attached to the request object as 'req.sendResponse'.
	 * If an error occurs, it is handled using the global error handling middleware.
	 */
	public static async middlewareGetFooter(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			const [query] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlOrdinaryConn, 'SELECT title, text, whatsapp, facebook, instagram, location, storeInfo, completeStoreInfo FROM footer WHERE id = ?;', ['only']);

			Object(req).sendResponse = Object(query)[0];

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}
	/**
	 * Middleware function to order a product.
	 * Retrieves the product information based on the provided ID from the database.
	 * Updates the product's click count and redirects the user to the WhatsApp ordering page.
	 * If the product is not found, it redirects the user to the homepage.
	 * If an error occurs, it is handled using the global error handling middleware.
	 */
	public static async middlewareOrderProduct(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			const id = req.params.id;

			const [query] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlOrdinaryConn, 'SELECT name, whatsapp, message, clicks FROM products WHERE id = ?;', [id!]);

			if (Object(query).length === 0) {
				Object(req).redirectTo = '/';

				return next();
			}

			const clicks = String(Object(query)[0].clicks + 1);

			await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlOrdinaryConn, 'UPDATE products SET clicks = ?, lastClick = CURRENT_TIMESTAMP WHERE id = ?;', [clicks, id!]);

			Object(req).redirectTo = 'https://api.whatsapp.com/send?phone=' + Object(query)[0].whatsapp + '&text=' + Object(query)[0].message.replace('###', Object(query)[0].name);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	/**
	 * Middleware function to send the response as JSON.
	 * Retrieves the response data from the request object and sends it as a JSON response.
	 */
	public static middlewareSendResponse(req: express.Request, res: express.Response) {
		res.json(Object(req).sendResponse);
	}

	/**
	 * Middleware function to perform a redirect.
	 * Retrieves the redirect URL from the request object and performs the redirect.
	 */
	public static middlewareRedirect(req: express.Request, res: express.Response) {
		res.redirect(Object(req).redirectTo);
	}
}
