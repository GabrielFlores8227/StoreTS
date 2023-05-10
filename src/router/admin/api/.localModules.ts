import express from 'express';
import { GlobalSqlModules, GlobalS3Modules, GlobalMiddlewareModules } from '../../.globalModules';
import multer from 'multer';
import sharp from 'sharp';
import crypto from 'crypto';
import http from 'http';

class InputMask {
	//*NEW SECTION
	//status: ok
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
				sharpFile: async (file: Express.Multer.File | undefined) => await this.sharpFile(file, 1920, 420, 'contain'),
			},
			smallImage: {
				sharpFile: async (file: Express.Multer.File | undefined) => await this.sharpFile(file, 800, 800, 'contain'),
			},
		},
		products: {
			image: {
				sharpFile: async (file: Express.Multer.File | undefined) => await this.sharpFile(file, 800, 800, 'contain'),
			},
		},
	};

	//status: ok
	private static async sharpFile(file: Express.Multer.File | undefined, width: number, height: number, fit: keyof sharp.FitEnum) {
		Object(file).originalname = crypto.randomBytes(128).toString('hex').substring(0, 255);

		try {
			Object(file).buffer = await sharp(Object(file).buffer)
				.resize({
					width,
					height,
					fit,
					background: { r: 0, g: 0, b: 0, alpha: 0 },
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

	//*NEW SECTION
	//status: ok
	public static readonly textMask = {
		authorization: {
			executeChecker: (headers: http.IncomingHttpHeaders) => this.checkAuthorization(headers),
		},
		id: {
			executeChecker: (body: { id: string }) => this.idChecker(body),
		},
		header: {
			executeChecker: (body: { title: string; description: string }) => this.headerChecker(body),
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
			executeChecker: (body: { title: string; text: string; whatsapp: string; instagram: string; facebook: string; location: string }) => this.footerChecker(body),
		},
	};

	//status: ok
	public static executeChecker(checker: { [key: string]: boolean }, status?: number, message?: string) {
		Object.keys(checker).forEach((key: string) => {
			if (!checker[key]) {
				throw {
					status: status ? status : 400,
					message: message ? message : "Please ensure that the key '" + key + "' is provided accurately to fulfill the request",
				};
			}
		});
	}

	//status: ok
	private static checkAuthorization(headers: http.IncomingHttpHeaders) {
		return {
			authorization: typeof headers.authorization === 'string',
		};
	}

	//status: ok
	private static idChecker(body: { id: string }) {
		return {
			id: typeof body.id === 'string',
		};
	}

	//status: ok
	private static headerChecker(body: { title: string; description: string }) {
		return {
			title: typeof body.title === 'string' && body.title.length >= 1 && body.title.length <= 50,
			description: typeof body.description === 'string' && body.description.length >= 1 && body.description.length <= 255,
		};
	}

	//status: ok
	private static propagandasChecker(body: { imagesContext: string[] }) {
		return {
			imagesContext: typeof body.imagesContext === 'object' && JSON.stringify(['bigImage', 'smallImage'].sort()) === JSON.stringify(body.imagesContext.sort()),
		};
	}

	//status: ok
	private static categoriesChecker(body: { name: string }) {
		return {
			name: typeof body.name === 'string' && body.name.length >= 1 && body.name.length <= 50,
		};
	}

	//status: ok
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

	//status: ok
	private static footerChecker(body: { title: string; text: string; whatsapp: string; instagram: string; facebook: string; location: string }) {
		return {
			title: typeof body.title === 'string' && body.title.length > 1 && body.title.length <= 50,
			text: typeof body.text === 'string' && body.text.length > 1 && body.text.length <= 255,
			whatsapp: typeof body.whatsapp === 'string' && !isNaN(Number(body.whatsapp)) && body.whatsapp.length === 13,
			instagram: typeof body.instagram === 'string' && body.instagram.length > 1 && body.instagram.length <= 50,
			facebook: typeof body.facebook === 'string' && body.facebook.length > 1 && body.facebook.length <= 50,
			location: typeof body.location === 'string' && body.location.length > 1 && body.location.length <= 65535,
		};
	}
}

class LocalModulesUtil {
	//*NEW SECTION
	//status: ok
	public static validateDataFormMiddlewareCheckAuth(headers: http.IncomingHttpHeaders) {
		const checker = InputMask.textMask.authorization.executeChecker(headers);
		InputMask.executeChecker(checker, 401, 'unauthorized');

		headers.authorization = headers.authorization!.replace('Bearer ', '');
	}

	//*NEW SECTION
	//status: ok
	public static async validateDataForMiddlewarePostPropaganda(body: { imagesContext: string[] }, files: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined) {
		const checker = InputMask.textMask.propagandas.executeChecker(body);
		InputMask.executeChecker(checker);

		const bigImage = Object(files)[body.imagesContext.indexOf('bigImage')];
		const smallImage = Object(files)[body.imagesContext.indexOf('smallImage')];

		await InputMask.imageMask.propagandas.bigImage.sharpFile(bigImage);
		await InputMask.imageMask.propagandas.smallImage.sharpFile(smallImage);
	}

	//status: ok
	public static validateDataForMiddlewareDeletePropaganda(body: { id: string }) {
		const checker = InputMask.textMask.id.executeChecker(body);
		InputMask.executeChecker(checker);
	}

	//*NEW SECTION
	//status: ok
	public static validateDataForMiddlewarePostCategory(body: { name: string }) {
		const checker = InputMask.textMask.categories.executeChecker(body);
		InputMask.executeChecker(checker);
	}

	//status: ok
	public static validateDataForMiddlewareDeleteCategory(body: { id: string }) {
		const checker = InputMask.textMask.id.executeChecker(body);
		InputMask.executeChecker(checker);
	}

	//*NEW SECTION
	//status: ok
	public static async validateDataForMiddlewarePostProduct(body: { category: string; name: string; price: string; off: string; installment: string; whatsapp: string; message: string }, file: Express.Multer.File | undefined) {
		const checker = await InputMask.textMask.products.executeChecker(body);
		InputMask.executeChecker(checker);

		await InputMask.imageMask.products.image.sharpFile(file);
	}

	//status: ok
	public static validateDataForMiddlewareDeleteProduct(body: { id: string }) {
		const checker = InputMask.textMask.id.executeChecker(body);
		InputMask.executeChecker(checker);
	}

	//*NEW SECTION
	//status: ok
	public static async validateDataForMiddlewarePutText(params: { table: string; column: string }, body: { id: string; [key: string]: string }) {
		const urlMap = {
			header: ['title', 'description'],
			categories: ['name'],
			products: ['category', 'name', 'price', 'off', 'installment', 'whatsapp', 'message'],
			footer: ['title', 'text', 'whatsapp', 'facebook', 'instagram', 'location'],
		};

		InputMask.executeChecker(
			{
				url: Object.keys(urlMap).includes(params.table) && Object(urlMap)[params.table].includes(params.column),
			},
			404,
			'not found',
		);

		const checker1 = InputMask.textMask.id.executeChecker(body);
		InputMask.executeChecker(checker1);

		const { [params.column]: columnValue } = await Object(InputMask).textMask[params.table].executeChecker(body);
		const checker2 = { [params.column]: columnValue };
		InputMask.executeChecker(checker2);
	}

	public static async validateDataForMiddlewarePutImage(params: { table: string; column: string }, body: { id: string }, file: Express.Multer.File | undefined) {
		const urlMap = {
			header: ['icon', 'logo'],
			propagandas: ['bigImage', 'smallImage'],
			products: ['image'],
		};

		InputMask.executeChecker(
			{
				url: Object.keys(urlMap).includes(params.table) && Object(urlMap)[params.table].includes(params.column),
			},
			404,
			'not found',
		);

		const checker = InputMask.textMask.id.executeChecker(body);
		InputMask.executeChecker(checker);

		await Object(InputMask).imageMask[params.table][params.column].sharpFile(file);
	}
}

export default class LocalModules {
	//*NEW SECTION
	//status: ok
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
				} catch (err: any) {
					GlobalMiddlewareModules.handleMiddlewareError(res, err);
				}
			});
		};
	}

	//*NEW SECTION
	//status: ok
	public static async middlewareCheckAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			const headers = req.headers;

			LocalModulesUtil.validateDataFormMiddlewareCheckAuth(headers);

			const [query] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT token FROM auth WHERE token = ? AND id = ?;', [Object(headers).authorization, 'only']);

			if (Object(query).length !== 1) {
				throw { status: 401, message: 'unauthorized' };
			}

			return next();
		} catch (err: any) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	//*NEW SECTION
	//status: ok
	public static middlewareSendResponse(status: number): (req: express.Request, res: express.Response, next: express.NextFunction) => void {
		return function (req: express.Request, res: express.Response) {
			res.json({
				status: status,
				message: 'ok',
			});
		};
	}

	//*NEW SECTION
	//status: ok
	public static async middlewarePostPropaganda(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			const body = req.body;
			const files = req.files;

			await LocalModulesUtil.validateDataForMiddlewarePostPropaganda(body, files);

			const bigImage: { [key: string]: string | Buffer } = Object(Object(files)[Object(body).imagesContext.indexOf('bigImage')]);
			const smallImage: { [key: string]: string | Buffer } = Object(files)[Object(body).imagesContext.indexOf('smallImage')];

			await GlobalS3Modules.uploadFileToS3Bucket(Object(bigImage).buffer.toString(), Object(bigImage).originalname, Object(bigImage).mimetype);
			await GlobalS3Modules.uploadFileToS3Bucket(Object(smallImage).buffer.toString(), Object(smallImage).originalname, Object(smallImage).mimetype);

			await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'INSERT INTO propagandas (bigImage, smallImage) VALUES (?, ?);', [Object(bigImage).originalname, Object(smallImage).originalname]);

			return next();
		} catch (err: any) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	//status: ok
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
		} catch (err: any) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	//*NEW SECTION
	//status: ok
	public static async middlewarePostCategory(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			const body = req.body;

			LocalModulesUtil.validateDataForMiddlewarePostCategory(body);

			await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'INSERT IGNORE INTO categories (name) VALUES (?);', [Object(body).name]);

			return next();
		} catch (err: any) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	//status: ok
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
		} catch (err: any) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	//*NEW SECTION
	//status: ok
	public static async middlewarePostProduct(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			const body = req.body;
			const file = req.file;

			await LocalModulesUtil.validateDataForMiddlewarePostProduct(body, file);

			await GlobalS3Modules.uploadFileToS3Bucket(Object(file).buffer, Object(file).originalname, Object(file).mimeType);

			await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'INSERT INTO products (category, name, image, price, off, installment, whatsapp, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?);', [Object(body).category, Object(body).name, Object(file).originalname, Object(body).price, Object(body).off, Object(body).installment, Object(body).whatsapp, Object(body).message]);

			return next();
		} catch (err: any) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	//status: ok
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
		} catch (err: any) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	//*NEW SECTION
	public static async middlewarePutText(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			const params = Object(req.params);
			const body = req.body;

			await LocalModulesUtil.validateDataForMiddlewarePutText(params, body);

			const [query] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT id FROM ' + params.table + ' WHERE id = ?;', [body.id]);

			if (Object(query).length !== 1) {
				return next();
			}

			await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'UPDATE ' + params.table + ' SET ' + params.column + ' = ? WHERE id = ?;', [body[params.column], body.id]);

			return next();
		} catch (err: any) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewarePutImage(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			const params = Object(req.params);
			const body = req.body;
			const file = req.file;

			await LocalModulesUtil.validateDataForMiddlewarePutImage(params, body, file);

			const [query] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT ' + params.column + ' FROM ' + params.table + ' WHERE id = ?;', [body.id]);

			if (Object(query).length !== 1) {
				return next();
			}

			await GlobalS3Modules.uploadFileToS3Bucket(Object(file).buffer, Object(query)[0][Object(params).column], Object(file).mimetype);

			return next();
		} catch (err: any) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}
}
