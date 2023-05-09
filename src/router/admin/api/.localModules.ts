import express from 'express';
import { GlobalSqlModules, GlobalS3Modules, GlobalMiddlewareModules } from '../../.globalModules';
import mysql2 from 'mysql2/promise';
import multer from 'multer';
import sharp from 'sharp';
import crypto from 'crypto';
import http from 'http';

class InputMask {
	public static readonly imageUpdatable = {
		header: {
			columns: {
				icon: {
					function: async (file: Express.Multer.File | undefined) => await this.sharpImage(file, 50, 50, 'contain'),
				},
				logo: {
					function: async (file: Express.Multer.File | undefined) => await this.sharpImage(file, 50, 50, 'contain'),
				},
			},
		},
		propagandas: {
			columns: {
				bigImage: {
					function: async (file: Express.Multer.File | undefined) => await this.sharpImage(file, 1920, 420, 'contain'),
				},
				smallImage: {
					function: async (file: Express.Multer.File | undefined) => await this.sharpImage(file, 800, 800, 'contain'),
				},
			},
		},
		products: {
			columns: {
				image: {
					function: async (file: Express.Multer.File | undefined) => await this.sharpImage(file, 800, 800, 'contain'),
				},
			},
		},
	};

	public static readonly textUpdatable = {
		header: {
			columns: ['title', 'description'],
			function: (body: { [key: string]: string | object }) => InputMask.headerChecker(body),
		},
		categories: {
			columns: ['name'],
			function: (body: { [key: string]: string | object }) => InputMask.categoriesChecker(body),
		},
		products: {
			columns: ['category', 'name', 'price', 'off', 'installment', 'whatsapp', 'messsage'],
			function: async (body: { [key: string]: string | object }) => await InputMask.productsChecker(body),
		},
		footer: {
			columns: ['title', 'text', 'whatsapp', 'instagram', 'facebook', 'location'],
			function: (body: { [key: string]: string | object }) => InputMask.footerChecker(body),
		},
	};

	private static async sharpImage(file: Express.Multer.File | undefined, width: number, height: number, fit: keyof sharp.FitEnum): Promise<void> {
		Object(file).originalname = crypto.randomBytes(128).toString('hex').substring(0, 255);

		Object(file).buffer = await sharp(Object(file).buffer)
			.resize({
				width,
				height,
				fit,
				background: { r: 0, g: 0, b: 0, alpha: 0 },
			})
			.toBuffer();
	}

	public static idChecker(body: { [key: string]: string | object }): { id: boolean } {
		return {
			id: typeof Object(body).id === 'string',
		};
	}

	public static headerChecker(body: { [key: string]: string | object }): { title: boolean; description: boolean } {
		return {
			title: typeof Object(body).title === 'string' && Object(body).title.length >= 1 && Object(body).title.length <= 50,
			description: typeof Object(body).description === 'string' && Object(body).description.length >= 1 && Object(body).description.length <= 255,
		};
	}

	public static propagandasChecker(body: { [key: string]: string | object }): { imagesContext: boolean } {
		return {
			imagesContext: typeof Object(body).imagesContext === 'object' && JSON.stringify(['bigImage', 'smallImage'].sort()) === JSON.stringify(Object(body).imagesContext.sort()),
		};
	}

	public static categoriesChecker(body: { [key: string]: string | object }): { name: boolean } {
		return {
			name: typeof Object(body).name === 'string' && Object(body).name.length >= 1 && Object(body).name.length <= 50,
		};
	}

	public static async productsChecker(body: { [key: string]: string | object }): Promise<{
		category: boolean;
		name: boolean;
		price: boolean;
		off: boolean;
		installment: boolean;
		whatsapp: boolean;
		message: boolean;
	}> {
		return {
			category: typeof Object(body).category === 'string' && Object(await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT name FROM categories WHERE id = ?;', [Object(body).category]))[0].length === 1,
			name: typeof Object(body).name === 'string' && Object(body).name.length >= 1 && Object(body).name.length <= 50,
			price: typeof Object(body).price === 'string' && !isNaN(Object(body).price) && Number(Object(body).price) >= 0,
			off: typeof Object(body).off === 'string' && !isNaN(Object(body).off) && Number(Object(body).off) >= 0 && Number(Object(body).off) <= 100,
			installment: typeof Object(body).installment === 'string' && Object(body).installment.length <= 50,
			whatsapp: typeof Object(body).whatsapp === 'string' && !isNaN(Object(body).whatsapp) && Object(body).whatsapp.length === 13,
			message: typeof Object(body).message === 'string' && Object(body).message.length <= 255,
		};
	}

	public static footerChecker(body: { [key: string]: string | object }): {
		title: boolean;
		description: boolean;
		whatsapp: boolean;
		instagram: boolean;
		facebook: boolean;
		location: boolean;
	} {
		return {
			title: typeof Object(body).title === 'string' && Object(body).title.length > 1 && Object(body).title.length < 50,
			description: typeof Object(body).text === 'string' && Object(body).text.length > 1 && Object(body).text.length < 255,
			whatsapp: typeof Object(body).whatsapp === 'string' && !isNaN(Object(body).whatsapp) && Object(body).whatsapp.length === 13,
			instagram: typeof Object(body).instagram === 'string' && Object(body).instagram.length > 1 && Object(body).instagram.length < 50,
			facebook: typeof Object(body).facebook === 'string' && Object(body).facebook.length > 1 && Object(body).facebook.length < 50,
			location: typeof Object(body).location === 'string' && Object(body).location.length > 1 && Object(body).location.length < 255,
		};
	}
}

class LocalModulesUtil {
	//*NEW SECTION
	//status: ok
	private static executeChecker(checker: { [key: string]: boolean }, message: string = 'Please ensure that all data is provided accurately to fulfill the request'): void {
		Object.keys(checker).forEach((key: string) => {
			if (!Object(checker)[key]) {
				throw {
					type: 400,
					message,
					check: key,
				};
			}
		});
	}

	//*NEW SECTION
	//status: ok
	public static validateDataFormMiddlewareCheckAuth(headers: http.IncomingHttpHeaders): void {
		this.executeChecker({
			authorization: typeof headers.authorization === 'string',
		});

		Object(headers).authorization = Object(headers).authorization.replace('Bearer ', '');
	}

	//*NEW SECTION
	//status: ok
	public static async validateDataForMiddlewarePostPropaganda(body: { [key: string]: string | object }, files: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined): Promise<void> {
		const inputMask = InputMask.propagandasChecker(body);

		this.executeChecker({
			imagesContext: inputMask.imagesContext,
		});

		try {
			const inputMask = InputMask.imageUpdatable.propagandas.columns;

			const bigImage: { [key: string]: string | Buffer } = Object(files)[Object(body).imagesContext.indexOf('bigImage')];
			const smallImage: { [key: string]: string | Buffer } = Object(files)[Object(body).imagesContext.indexOf('smallImage')];

			Object(bigImage).buffer = await inputMask.bigImage.function(Object(bigImage));
			Object(smallImage).buffer = await inputMask.smallImage.function(Object(smallImage));
		} catch (err: any) {
			if (err.message === 'Input buffer contains unsupported image format') {
				throw {
					type: 400,
					message: 'Please provide valid images to fulfill the request',
					check: 'files',
				};
			}

			throw err;
		}
	}

	//status: ok
	public static validateDataForMiddlewareDeletePropaganda(body: { [key: string]: string | object }): void {
		const inputMask: { id: boolean } = InputMask.idChecker(body);

		this.executeChecker({
			id: inputMask.id,
		});
	}

	//*NEW SECTION
	//status: ok
	public static validateDataForMiddlewarePostCategory(body: { [key: string]: string | object }): void {
		const inputMask: { name: boolean } = InputMask.categoriesChecker(body);

		this.executeChecker({
			name: inputMask.name,
		});
	}

	//status: ok
	public static validateDataForMiddlewareDeleteCategory(body: { [key: string]: string | object }): void {
		const inputMask: { id: boolean } = InputMask.idChecker(body);

		this.executeChecker({
			id: inputMask.id,
		});
	}

	//*NEW SECTION
	//status: ok
	public static async validateDataForMiddlewarePostProduct(body: { [key: string]: string | object }, file: Express.Multer.File | undefined): Promise<void> {
		const inputMask: { category: boolean; name: boolean; price: boolean; off: boolean; installment: boolean; whatsapp: boolean; message: boolean } = await InputMask.productsChecker(body);

		this.executeChecker({
			category: inputMask.category,
			name: inputMask.name,
			price: inputMask.price,
			off: inputMask.off,
			installment: inputMask.installment,
			whatsapp: inputMask.whatsapp,
			message: inputMask.message,
		});

		try {
			const inputMask = InputMask.imageUpdatable.products.columns;

			Object(file).buffer = await inputMask.image.function(Object(file));
		} catch (err: any) {
			if (err.message === 'Input buffer contains unsupported image format') {
				throw {
					type: 400,
					message: 'Please provide valid images to fulfill the request',
					check: 'files',
				};
			}

			throw err;
		}
	}

	//status: ok
	public static validateDataForMiddlewareDeleteProduct(body: { [key: string]: string | object }): void {
		const inputMask: { id: boolean } = InputMask.idChecker(body);

		this.executeChecker({
			id: inputMask.id,
		});
	}

	//*NEW SECTION
	//status: ok
	public static async validateDataForMiddlewarePutText(params: object, body: { [key: string]: string | object }): Promise<void> {
		this.executeChecker(
			{
				url: Object(InputMask.textUpdatable)[Object(params).table] !== undefined && Object(InputMask.textUpdatable)[Object(params).table].columns.includes(Object(params).column),
			},
			'not found',
		);

		const mask1: { id: boolean } = InputMask.idChecker(body);

		if (Object(InputMask.textUpdatable)[Object(params).table].function.constructor.name === 'AsyncFunction') {
			var mask2: { [key: string]: boolean } = await Object(InputMask.textUpdatable)[Object(params).table].function(body);
		} else {
			var mask2: { [key: string]: boolean } = Object(InputMask.textUpdatable)[Object(params).table].function(body);
		}

		const executeCheckerObject: { [key: string]: boolean } = { id: mask1.id };
		Object(executeCheckerObject)[Object(params).column] = mask2[Object(params).column];

		this.executeChecker(executeCheckerObject);
	}

	public static async validateDataForMiddlewarePutImage(params: object, body: { [key: string]: string | object }, file: Express.Multer.File | undefined): Promise<void> {
		this.executeChecker(
			{
				url: Object(InputMask.imageUpdatable)[Object(params).table] !== undefined && Object(InputMask.imageUpdatable)[Object(params).table].columns[Object(params).column] !== undefined,
			},
			'not found',
		);

		const inputMask = InputMask.idChecker(body);

		this.executeChecker({
			id: inputMask.id,
		});

		try {
			const inputMask = Object(InputMask).imageUpdatable[Object(params).table].columns;

			await inputMask[Object(params).column].function(Object(file));
		} catch (err: any) {
			if (err.message === 'Input buffer contains unsupported image format') {
				throw {
					type: 400,
					message: 'Please provide valid images to fulfill the request',
					check: 'files',
				};
			}

			throw err;
		}
	}
}

export default class LocalModules {
	//*NEW SECTION
	//status: ok
	public static middlewareUploadFiles(minCount: number, maxCount: number): (req: express.Request, res: express.Response, next: express.NextFunction) => void {
		return function (req: express.Request, res: express.Response, next: express.NextFunction) {
			let upload: express.RequestHandler;
			if (maxCount == 1) {
				upload = GlobalMiddlewareModules.multer.single('file');
			} else {
				upload = GlobalMiddlewareModules.multer.array('files', maxCount);
			}

			upload(req, res, (err: any) => {
				if (err instanceof multer.MulterError) {
					return GlobalMiddlewareModules.handleMiddlewareError(res, {
						type: 400,
						message: 'Please provide the appropriate number of images to fulfill the request',
						check: maxCount === 1 ? 'file' : 'files',
					});
				} else if (err) {
					return GlobalMiddlewareModules.handleMiddlewareError(res, err);
				}

				if ((maxCount === 1 && typeof req.file !== 'object') || (maxCount > 1 && Object(req).files.length < minCount)) {
					return GlobalMiddlewareModules.handleMiddlewareError(res, {
						type: 400,
						message: 'Please provide the appropriate number of images to fulfill the request',
						check: maxCount === 1 ? 'file' : 'files',
					});
				}

				return next();
			});
		};
	}

	//*NEW SECTION
	//status: ok
	public static async middlewareCheckAuth(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			const headers: http.IncomingHttpHeaders = req.headers;

			LocalModulesUtil.validateDataFormMiddlewareCheckAuth(headers);

			const [query]: [mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]] | undefined = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT token FROM auth WHERE token = ? AND id = ?;', [Object(headers).authorization, 'only']);

			if (Object(query).length !== 1) {
				throw { type: 401, message: 'unauthorized' };
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
				type: status,
				message: 'ok',
			});
		};
	}

	//*NEW SECTION
	//status: ok
	public static async middlewarePostPropaganda(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			const body: { [key: string]: string | Object } = req.body;
			const files: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined = req.files;

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
			const body: { [key: string]: string | Object } = req.body;

			LocalModulesUtil.validateDataForMiddlewareDeletePropaganda(body);

			const [query]: [mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT bigImage, smallImage FROM propagandas WHERE id = ?;', [Object(body).id]);

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
			const body: { [key: string]: string | Object } = req.body;

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
			const body: { [key: string]: string | Object } = req.body;

			LocalModulesUtil.validateDataForMiddlewareDeleteCategory(body);

			const [query1]: [mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT id FROM categories WHERE id = ?;', [Object(body).id]);

			if (Object(query1).length !== 1) {
				return next();
			}

			const [query2]: [mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT id, image FROM products WHERE category = ?;', [Object(body).id]);

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
			const body: { [key: string]: string | Object } = req.body;
			const file: Express.Multer.File | undefined = req.file;

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
			const body: { [key: string]: string | Object } = req.body;

			LocalModulesUtil.validateDataForMiddlewareDeleteProduct(body);

			const [query]: [mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT image FROM products WHERE id = ?;', [Object(body).id]);

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
			const params: object = req.params;
			const body: { [key: string]: string | Object } = req.body;

			await LocalModulesUtil.validateDataForMiddlewarePutText(params, body);

			const [query]: [mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT id FROM ' + Object(params).table + ' WHERE id = ?;', [Object(body).id]);

			if (Object(query).length !== 1) {
				return next();
			}

			await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'UPDATE ' + Object(params).table + ' SET ' + Object(params).column + ' = ? WHERE id = ?;', [Object(body)[Object(params).column], Object(body).id]);

			return next();
		} catch (err: any) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewarePutImage(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			const params: object = req.params;
			const body: { [key: string]: string | Object } = req.body;
			const file: Express.Multer.File | undefined = req.file;

			await LocalModulesUtil.validateDataForMiddlewarePutImage(params, body, file);

			return next();
		} catch (err: any) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}
}
