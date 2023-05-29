import express, { NextFunction } from 'express';
import {
	GlobalMySQLModules,
	GlobalS3Modules,
	GlobalMiddlewareModules,
} from '../../globalModules';

class LocalModulesUtil {
	public static async buildHeader() {
		const [query] = await GlobalMySQLModules.query(
			'SELECT icon, logo, title, description, color FROM header WHERE id = ?;',
			['only'],
		);

		Object(query)[0].icon =
			await GlobalS3Modules.generateSignedUrlForS3BucketFile(
				Object(query)[0].icon,
			);
		Object(query)[0].logo =
			await GlobalS3Modules.generateSignedUrlForS3BucketFile(
				Object(query)[0].logo,
			);

		return Object(query)[0];
	}

	public static async buildPropagandas() {
		const [query] = await GlobalMySQLModules.query(
			'SELECT bigImage, smallImage FROM propagandas ORDER BY position;',
		);

		for (let c = 0; c < Object(query).length; c++) {
			Object(query)[c].bigImage =
				await GlobalS3Modules.generateSignedUrlForS3BucketFile(
					Object(query)[c].bigImage,
				);
			Object(query)[c].smallImage =
				await GlobalS3Modules.generateSignedUrlForS3BucketFile(
					Object(query)[c].smallImage,
				);
		}

		return query;
	}

	public static async buildProducts() {
		const [query1] = await GlobalMySQLModules.query(
			'SELECT id, name FROM categories ORDER BY position;',
		);

		const products = {};

		for (let c = 0; c < Object(query1).length; c++) {
			const [query2] = await GlobalMySQLModules.query(
				'SELECT id, name, image, price, off, installment FROM products WHERE category = ? ORDER BY position;',
				[Object(query1)[c].id],
			);

			for (let i = 0; i < Object(query2).length; i++) {
				Object(query2)[i].image =
					await GlobalS3Modules.generateSignedUrlForS3BucketFile(
						Object(query2)[i].image,
					);

				if (!Object(products)[Object(query1)[c].name]) {
					Object(products)[Object(query1)[c].name] = [];
				}

				Object(products)[Object(query1)[c].name].push(Object(query2)[i]);
			}
		}

		return products;
	}

	public static async buildFooter() {
		const [query] = await GlobalMySQLModules.query(
			'SELECT title, text, whatsapp, facebook, instagram, location, storeInfo, completeStoreInfo FROM footer WHERE id = ?;',
			['only'],
		);

		return Object(query)[0];
	}
}

export default class LocalModules {
	public static async middlewareGetBuilder(
		req: express.Request,
		res: express.Response,
		next: NextFunction,
	) {
		try {
			Object(req).builder = {
				header: await LocalModulesUtil.buildHeader(),
				propagandas: await LocalModulesUtil.buildPropagandas(),
				products: await LocalModulesUtil.buildProducts(),
				footer: await LocalModulesUtil.buildFooter(),
			};

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}
}
