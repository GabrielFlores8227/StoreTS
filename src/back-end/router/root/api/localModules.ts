import express from 'express';
import { GlobalSqlModules, GlobalS3Modules, GlobalMiddlewareModules } from '../../globalModules';

export default class LocalModules {
	public static async middlewareGetHeader(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			const [query] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlSelectorConn, 'SELECT icon, logo, title, description, color FROM header WHERE id = ?;', ['only']);

			Object(query)[0].icon = await GlobalS3Modules.generateSignedUrlForS3BucketFile(Object(query)[0].icon);
			Object(query)[0].logo = await GlobalS3Modules.generateSignedUrlForS3BucketFile(Object(query)[0].logo);

			Object(req).sendBack = Object(query)[0];

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewareGetPropagandas(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			const [query] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlSelectorConn, 'SELECT bigImage, smallImage FROM propagandas ORDER BY position;');

			for (let c = 0; c < Object(query).length; c++) {
				Object(query)[c].bigImage = await GlobalS3Modules.generateSignedUrlForS3BucketFile(Object(query)[c].bigImage);
				Object(query)[c].smallImage = await GlobalS3Modules.generateSignedUrlForS3BucketFile(Object(query)[c].smallImage);
			}

			Object(req).sendBack = query;

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewareGetCategories(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			const [query] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlSelectorConn, 'SELECT name FROM categories ORDER BY position;');
			Object(req).sendBack = query;
			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewareGetProducts(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			const [query1] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlSelectorConn, 'SELECT id, name FROM categories ORDER BY position;');
			const sendBack = {};

			for (let c = 0; c < Object(query1).length; c++) {
				const [query2] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlSelectorConn, 'SELECT name, image, price, off, installment, whatsapp, message FROM products WHERE category = ? ORDER BY position;', [Object(query1)[c].id]);

				for (let i = 0; i < Object(query2).length; i++) {
					Object(query2)[i].image = await GlobalS3Modules.generateSignedUrlForS3BucketFile(Object(query2)[i].image);

					if (!Object(sendBack)[Object(query1)[c].name]) {
						Object(sendBack)[Object(query1)[c].name] = [];
					}

					Object(sendBack)[Object(query1)[c].name].push(Object(query2)[i]);
				}
			}

			Object(req).sendBack = sendBack;

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewareGetFooter(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			const [query] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlSelectorConn, 'SELECT title, text, whatsapp, facebook, instagram, location, storeInfo, completeStoreInfo FROM footer WHERE id = ?;', ['only']);

			Object(req).sendBack = Object(query)[0];

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static middlewareSendResponse(req: express.Request, res: express.Response) {
		res.json(Object(req).sendBack);
	}
}
