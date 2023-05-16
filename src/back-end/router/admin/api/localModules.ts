import express from 'express';
import { GlobalSqlModules, GlobalS3Modules, GlobalMiddlewareModules } from '../../globalModules';
import multer from 'multer';
import sharp from 'sharp';
import crypto from 'crypto';
import { IncomingHttpHeaders } from 'http';

class InputMask {
	public static readonly imageMask = {
		header: {
			icon: {
				sharpFile: async (file: Express.Multer.File | undefined) => await this.sharpFile(file, 50, 50, 'contain'),
			},
			logo: {
				sharpFile: async (file: Express.Multer.File | undefined) => await this.sharpFile(file, 437, 36, 'contain'),
			},
		},
		propagandas: {
			bigImage: {
				sharpFile: async (file: Express.Multer.File | undefined) => await this.sharpFile(file, 1920, 460, 'contain'),
			},
			smallImage: {
				sharpFile: async (file: Express.Multer.File | undefined) => await this.sharpFile(file, 1080, 1080, 'contain'),
			},
		},
		products: {
			image: {
				sharpFile: async (file: Express.Multer.File | undefined) => await this.sharpFile(file, 1080, 1080, 'contain'),
			},
		},
	};

	private static async sharpFile(file: Express.Multer.File | undefined, width: number, height: number, fit: keyof sharp.FitEnum) {
		if (!['image/png', 'image/jpeg', 'image/jpg', 'image/JPG', "image/webp"].includes(Object(file).mimetype)) {
			throw {
				status: 400,
				message: 'Please provide valid image(s) to fulfill the request',
			};
		}

		Object(file).originalname = crypto.randomBytes(128).toString('hex').substring(0, 255)

		try {
			Object(file).buffer = await sharp(Object(file).buffer)
				.resize({
					width,
					height,
					fit,
					background: { r: 255, g: 255, b: 255, alpha: 255 },
				})
				.toBuffer();
		} catch (err: any) {
			if (err.message === 'Input buffer contains unsupported image format') {
				throw {
					status: 400,
					message: 'Please provide valid image(s) to fulfill the request',
				};
			}

			throw err;
		}
	}

	public static readonly textMask = {
		authorization: {
			executeChecker: (headers: IncomingHttpHeaders) => this.checkAuthorization(headers),
		},
		id: {
			executeChecker: (body: { id: string }) => this.idChecker(body),
		},
		ids: {
			executeChecker: async (table: string, body: { ids: string[] }) => await this.idsChecker(table, body),
		},
		header: {
			executeChecker: (body: { title: string; description: string; color: string }) => this.headerChecker(body),
		},
		propagandas: {
			executeChecker: (body: { imagesContext: string[] }) => this.propagandasChecker(body),
		},
		categories: {
			executeChecker: (body: { name: string }) => this.categoriesChecker(body),
		},
		products: {
			executeChecker: async (body: { category: string; name: string; price: string; off: string; installment: string; whatsapp: string; message: string }) => await this.productsChecker(body),
		},
		footer: {
			executeChecker: (body: { title: string; text: string; whatsapp: string; instagram: string; facebook: string; location: string, storeInfo: string, completeStoreInfo: string }) => this.footerChecker(body),
		},
	};

	public static executeChecker(checker: { [key: string]: boolean }, status?: number, message?: string) {
		Object.keys(checker).forEach((key: string) => {
			if (!checker[key]) {
				throw {
					status: status || 400,
					message: message || "Please ensure that the key '" + key + "' is provided accurately to fulfill the request",
				};
			}
		});
	}

	private static checkAuthorization(headers: IncomingHttpHeaders) {
		return {
			authorization: typeof headers.authorization === 'string',
		};
	}

	private static idChecker(body: { id: string }) {
		return {
			id: typeof body.id === 'string',
		};
	}

	private static async idsChecker(table: string, body: { ids: string[] }) {
		return {
			ids:
				typeof body.ids === 'object' &&
				JSON.stringify(
					Object(await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT id FROM ' + table))[0]
						.map((item: any) => String(item.id))
						.sort(),
				) === JSON.stringify(body.ids.sort()),
		};
	}

	private static headerChecker(body: { title: string; description: string; color: string }) {
		return {
			title: typeof body.title === 'string' && body.title.length >= 1 && body.title.length <= 50,
			description: typeof body.description === 'string' && body.description.length >= 1 && body.description.length <= 255,
			color: typeof body.color === 'string' && body.color.length === 7,
		};
	}

	private static propagandasChecker(body: { imagesContext: string[] }) {
		return {
			imagesContext: typeof body.imagesContext === 'object' && JSON.stringify(['bigImage', 'smallImage'].sort()) === JSON.stringify(body.imagesContext.sort()),
		};
	}

	private static categoriesChecker(body: { name: string }) {
		return {
			name: typeof body.name === 'string' && body.name.length >= 1 && body.name.length <= 50,
		};
	}

	private static async productsChecker(body: { category: string; name: string; price: string; off: string; installment: string; whatsapp: string; message: string }) {
		return {
			category: typeof body.category === 'string' && Object(await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT name FROM categories WHERE id = ?;', [body.category]))[0].length === 1,
			name: typeof body.name === 'string' && body.name.length >= 1 && body.name.length <= 50,
			price: typeof body.price === 'string' && !isNaN(Number(body.price)) && Number(body.price) >= 0,
			off: typeof body.off === 'string' && !isNaN(Number(body.off)) && Number(body.off) >= 0 && Number(body.off) <= 100,
			installment: typeof body.installment === 'string' && body.installment.length <= 50,
			whatsapp: typeof body.whatsapp === 'string' && !isNaN(Number(body.whatsapp)) && body.whatsapp.length === 13,
			message: typeof body.message === 'string' && body.message.length <= 255,
		};
	}

	private static footerChecker(body: { title: string; text: string; whatsapp: string; instagram: string; facebook: string; location: string, storeInfo: string, completeStoreInfo: string }) {
		return {
			title: typeof body.title === 'string' && body.title.length > 1 && body.title.length <= 50,
			text: typeof body.text === 'string' && body.text.length > 1 && body.text.length <= 255,
			whatsapp: typeof body.whatsapp === 'string' && !isNaN(Number(body.whatsapp)) && body.whatsapp.length === 13,
			instagram: typeof body.instagram === 'string' && body.instagram.length > 1 && body.instagram.length <= 255,
			facebook: typeof body.facebook === 'string' && body.facebook.length > 1 && body.facebook.length <= 255,
			location: typeof body.location === 'string' && body.location.length > 1 && body.location.length <= 65535,
			storeInfo: typeof body.storeInfo === 'string' && body.storeInfo.length > 1 && body.storeInfo.length <= 50,
			completeStoreInfo: typeof body.completeStoreInfo === 'string' && body.completeStoreInfo.length > 1 && body.completeStoreInfo.length <= 100
		};
	}
}

class LocalModulesUtil {
	public static validateDataFormMiddlewareCheckAuth(headers: IncomingHttpHeaders) {
		const checker = InputMask.textMask.authorization.executeChecker(headers);
		InputMask.executeChecker(checker, 401, 'unauthorized');

		headers.authorization = headers.authorization!.replace('Bearer ', '');
	}

	public static async validateDataForMiddlewarePostPropaganda(body: { imagesContext: string[] }, files: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined) {
		const checker = InputMask.textMask.propagandas.executeChecker(body);
		InputMask.executeChecker(checker);

		const bigImage = Object(files)[body.imagesContext.indexOf('bigImage')];
		const smallImage = Object(files)[body.imagesContext.indexOf('smallImage')];

		await InputMask.imageMask.propagandas.bigImage.sharpFile(bigImage);
		await InputMask.imageMask.propagandas.smallImage.sharpFile(smallImage);
	}

	public static validateDataForMiddlewareDeletePropaganda(body: { id: string }) {
		const checker = InputMask.textMask.id.executeChecker(body);
		InputMask.executeChecker(checker);
	}

	public static validateDataForMiddlewarePostCategory(body: { name: string }) {
		const checker = InputMask.textMask.categories.executeChecker(body);
		InputMask.executeChecker(checker);
	}

	public static validateDataForMiddlewareDeleteCategory(body: { id: string }) {
		const checker = InputMask.textMask.id.executeChecker(body);
		InputMask.executeChecker(checker);
	}

	public static async validateDataForMiddlewarePostProduct(body: { category: string; name: string; price: string; off: string; installment: string; whatsapp: string; message: string }, file: Express.Multer.File | undefined) {
		const checker = await InputMask.textMask.products.executeChecker(body);
		InputMask.executeChecker(checker);

		await InputMask.imageMask.products.image.sharpFile(file);
	}

	public static validateDataForMiddlewareDeleteProduct(body: { id: string }) {
		const checker = InputMask.textMask.id.executeChecker(body);
		InputMask.executeChecker(checker);
	}

	public static async validateDataForMiddlewarePutText(table: string, column: string, body: { id: string; [key: string]: string }) {
		const checker1 = InputMask.textMask.id.executeChecker(body);
		InputMask.executeChecker(checker1);

		const { [column]: columnValue } = await Object(InputMask).textMask[table].executeChecker(body);
		InputMask.executeChecker({ [column]: columnValue });
	}

	public static async validateDataForMiddlewarePutImage(table: string, column: string, body: { id: string }, file: Express.Multer.File | undefined) {
		const checker = InputMask.textMask.id.executeChecker(body);
		InputMask.executeChecker(checker);

		await Object(InputMask).imageMask[table][column].sharpFile(file);
	}

	public static async validateDataForMiddlewarePutPosition(table: string, body: { ids: string[] }) {
		const checker = await InputMask.textMask.ids.executeChecker(table, body);
		InputMask.executeChecker(checker);
	}
}

export default class LocalModules {
	public static middlewareUploadFiles(minCount: number, maxCount: number): (req: express.Request, res: express.Response, next: express.NextFunction) => void {
		return async function (req: express.Request, res: express.Response, next: express.NextFunction) {
			if (maxCount == 1) {
				var upload = GlobalMiddlewareModules.multer.single('file');
			} else {
				var upload = GlobalMiddlewareModules.multer.array('files', maxCount);
			}

			upload(req, res, (err: any) => {
				try {
					if (err instanceof multer.MulterError || (maxCount === 1 && typeof req.file !== 'object') || (maxCount > 1 && Object(req).files.length < minCount)) {
						throw {
							status: 400,
							message: 'Please provide the appropriate number of image(s) to fulfill the request',
						};
					} else if (err) {
						throw err;
					}

					return next();
				} catch (err) {
					GlobalMiddlewareModules.handleMiddlewareError(res, err);
				}
			});
		};
	}

	public static async middlewareCheckAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			const headers = req.headers;

			LocalModulesUtil.validateDataFormMiddlewareCheckAuth(headers);

			const [query] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT token FROM auth WHERE token = ? AND id = ?;', [Object(headers).authorization, 'only']);

			if (Object(query).length !== 1) {
				throw { status: 401, message: 'unauthorized' };
			}

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewarePostPropaganda(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			const body = req.body;
			const files = req.files;

			await LocalModulesUtil.validateDataForMiddlewarePostPropaganda(body, files);

			const bigImage: { [key: string]: string | Buffer } = Object(Object(files)[Object(body).imagesContext.indexOf('bigImage')]);
			const smallImage: { [key: string]: string | Buffer } = Object(files)[Object(body).imagesContext.indexOf('smallImage')];

			await GlobalS3Modules.uploadFileToS3Bucket(Object(bigImage).buffer, Object(bigImage).originalname, Object(bigImage).mimetype);
			await GlobalS3Modules.uploadFileToS3Bucket(Object(smallImage).buffer, Object(smallImage).originalname, Object(smallImage).mimetype);

			await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'INSERT INTO propagandas (bigImage, smallImage) VALUES (?, ?);', [Object(bigImage).originalname, Object(smallImage).originalname]);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewareDeletePropaganda(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			const body = req.body;

			LocalModulesUtil.validateDataForMiddlewareDeletePropaganda(body);

			const [query] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT bigImage, smallImage FROM propagandas WHERE id = ?;', [Object(body).id]);

			if (Object(query).length !== 1) {
				return next();
			}

			await GlobalS3Modules.deleteFileFromS3Bucket(Object(query)[0].bigImage);
			await GlobalS3Modules.deleteFileFromS3Bucket(Object(query)[0].smallImage);

			await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'DELETE FROM propagandas WHERE id = ?;', [Object(body).id]);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewarePostCategory(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			const body = req.body;

			LocalModulesUtil.validateDataForMiddlewarePostCategory(body);

			await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'INSERT IGNORE INTO categories (name) VALUES (?);', [Object(body).name]);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewareDeleteCategory(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			const body = req.body;

			LocalModulesUtil.validateDataForMiddlewareDeleteCategory(body);

			const [query1] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT id FROM categories WHERE id = ?;', [Object(body).id]);

			if (Object(query1).length !== 1) {
				return next();
			}

			const [query2] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT id, image FROM products WHERE category = ?;', [Object(body).id]);

			Object(query2).forEach(async (row: { id: number; image: string }) => {
				await GlobalS3Modules.deleteFileFromS3Bucket(row.image);

				await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'DELETE FROM products WHERE id = ?;', [String(row.id)]);
			});

			await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'DELETE FROM categories WHERE id = ?;', [Object(body).id]);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewarePostProduct(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			const body = req.body;
			const file = req.file;

			await LocalModulesUtil.validateDataForMiddlewarePostProduct(body, file);

			await GlobalS3Modules.uploadFileToS3Bucket(Object(file).buffer, Object(file).originalname, Object(file).mimeType);

			await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'INSERT INTO products (category, name, image, price, off, installment, whatsapp, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?);', [Object(body).category, Object(body).name, Object(file).originalname, Object(body).price, Object(body).off, Object(body).installment, Object(body).whatsapp, Object(body).message]);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewareDeleteProduct(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			const body = req.body;

			LocalModulesUtil.validateDataForMiddlewareDeleteProduct(body);

			const [query] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT image FROM products WHERE id = ?;', [Object(body).id]);

			if (Object(query).length !== 1) {
				return next();
			}

			await GlobalS3Modules.deleteFileFromS3Bucket(Object(query)[0].image);

			await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'DELETE FROM products WHERE id = ?;', [Object(body).id]);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewarePutText(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			const body = req.body;
			const url = req.originalUrl.split('/');
			const table = String(url[3]);
			const column = String(url[4]);

			await LocalModulesUtil.validateDataForMiddlewarePutText(table, column, body);

			const [query] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT id FROM ' + table + ' WHERE id = ?;', [body.id]);

			if (Object(query).length !== 1) {
				return next();
			}

			await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'UPDATE ' + table + ' SET ' + column + ' = ? WHERE id = ?;', [body[column], body.id]);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewarePutImage(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			const body = req.body;
			const url = req.originalUrl.split('/');
			const table = String(url[3]);
			const column = String(url[4]);
			const file = req.file;

			await LocalModulesUtil.validateDataForMiddlewarePutImage(table, column, body, file);

			const [query] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT ' + column + ' FROM ' + table + ' WHERE id = ?;', [body.id]);

			if (Object(query).length !== 1) {
				return next();
			}

			await GlobalS3Modules.uploadFileToS3Bucket(Object(file).buffer, Object(query)[0][column], Object(file).mimetype);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewarePutPosition(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			const body = req.body;
			const url = req.originalUrl.split('/');
			const table = String(url[3]);

			await LocalModulesUtil.validateDataForMiddlewarePutPosition(table, JSON.parse(JSON.stringify(body)));

			body.ids.forEach(async (id: any, index: number) => {
				await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'UPDATE ' + table + ' SET position = ? WHERE id = ?', [index, id]);
			});

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static middlewareSendResponse(status: number): (req: express.Request, res: express.Response, next: express.NextFunction) => void {
		return function (_: express.Request, res: express.Response) {
			res.json({
				status: status,
				message: 'ok',
			});
		};
	}
}
