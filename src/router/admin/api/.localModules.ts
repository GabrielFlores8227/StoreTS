import express from 'express';
import { GlobalSqlModules, GlobalS3Modules, GlobalMiddlewareModules } from '../../.globalModules';
import mysql2 from 'mysql2/promise';
import multer from 'multer';
import sharp from 'sharp';
import crypto from 'crypto';
import http from 'http';

class LocalModulesUtil {
	//*NEW SECTION
	//status: ok
	private static generateRandomBytes(): string {
		return crypto.randomBytes(128).toString('hex').substring(0, 255);
	}

	//status: ok
	private static async sharpImage(imageBuffer: Buffer, width: number, height: number, fit: keyof sharp.FitEnum): Promise<Buffer> {
		return await sharp(imageBuffer)
			.resize({
				width,
				height,
				fit,
				background: { r: 0, g: 0, b: 0, alpha: 0 },
			})
			.toBuffer();
	}

	//status: ok
	private static sqlMask(body: { [key: string]: string | object }, table: 'header' | 'propagandas' | 'categories' | 'products' | 'footer'): { [key: string]: boolean } {
		const mask: { [key: string]: { [key: string]: boolean } } = {
			header: {
				title: typeof Object(body).title === 'string' && Object(body).title.length > 1 && Object(body).title.length < 50,
				description: typeof Object(body).description === 'string' && Object(body).description.length > 1 && Object(body).description.length < 255,
			},
			propagandas: {
				id: typeof Object(body).id === 'string',
				imagesContext: typeof Object(body).imagesContext === 'object' && JSON.stringify(['bigImage', 'smallImage'].sort()) === JSON.stringify(Object(body).imagesContext.sort()),
			},
			categories: {
				id: typeof Object(body).id === 'string',
				category: typeof Object(body).category === 'string' && Object(body).category.length > 1 && Object(body).category.length < 50,
			},
			products: {
				id: typeof Object(body).id === 'string',
				category: typeof Object(body).category === 'string',
				name: typeof Object(body).name === 'string' && Object(body).name.length > 1 && Object(body).name.length < 50,
				price: typeof Object(body).price === 'string' && !isNaN(Object(body).price) && Number(Object(body).price) > 0,
				off: typeof Object(body).off === 'string' && !isNaN(Object(body).off) && Number(Object(body).off) > 0 && Number(Object(body).off) < 100,
				installment: typeof Object(body).installment === 'string' && Object(body).installment.length < 50,
				whatsapp: typeof Object(body).whatsapp === 'string' && !isNaN(Object(body).whatsapp) && Object(body).whatsapp.length === 13,
				message: typeof Object(body).message === 'string' && Object(body).message.length < 255,
			},
			footer: {
				title: typeof Object(body).title === 'string' && Object(body).title.length > 1 && Object(body).title.length < 50,
				description: typeof Object(body).text === 'string' && Object(body).text.length > 1 && Object(body).text.length < 255,
				whatsapp: typeof Object(body).whatsapp === 'string' && !isNaN(Object(body).whatsapp) && Object(body).whatsapp.length === 13,
				instagram: typeof Object(body).instagram === 'string' && Object(body).instagram.length > 1 && Object(body).instagram.length < 50,
				facebook: typeof Object(body).facebook === 'string' && Object(body).facebook.length > 1 && Object(body).facebook.length < 50,
				location: typeof Object(body).location === 'string' && Object(body).location.length > 1 && Object(body).location.length < 255,
			},
		};

		return Object(mask)[table];
	}

	//status: ok
	private static executeChecker(checker: { [key: string]: boolean }): void {
		Object.keys(checker).forEach((key: string) => {
			if (!Object(checker)[key]) {
				throw {
					type: 400,
					message: 'Please ensure that all data is provided accurately to fulfill the request',
					check: key,
				};
			}
		});
	}

	//*NEW SECTION
	//status: ok
	public static validateDataFormMiddlewareCheckAuth(headers: http.IncomingHttpHeaders): void {
		this.executeChecker({
			authorization: typeof Object(headers).authorization === 'string' && Object(headers).authorization.split(':').length === 2,
		});

		const auth: string[] = String(Object(headers).authorization)
			.substring(7, String(Object(headers).authorization).length)
			.split(':');

		Object(headers).authorization = {
			user: auth[0],
			token: auth[1],
		};
	}

	//*NEW SECTION
	//status: ok
	public static async validateDataForMiddlewarePostPropaganda(body: { [key: string]: string | object }, files: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined): Promise<void> {
		this.executeChecker({
			imagesContext: Object(this.sqlMask(body, 'propagandas')).imagesContext,
		});

		const bigImage: { [key: string]: string | Buffer } = Object(files)[Object(body).imagesContext.indexOf('bigImage')];
		Object(bigImage).originalname = this.generateRandomBytes();

		const smallImage: { [key: string]: string | Buffer } = Object(files)[Object(body).imagesContext.indexOf('smallImage')];
		Object(smallImage).originalname = this.generateRandomBytes();

		try {
			Object(bigImage).bigImage = await this.sharpImage(Object(bigImage).buffer, 1920, 420, 'contain');

			Object(smallImage).buffer = await this.sharpImage(Object(smallImage).buffer, 800, 800, 'contain');
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
		this.executeChecker({
			id: Object(this.sqlMask(body, 'propagandas')).id,
		});
	}

	//*NEW SECTION
	//status: ok
	public static validateDataForMiddlewarePostCategory(body: { [key: string]: string | object }): void {
		this.executeChecker({
			category: Object(this.sqlMask(body, 'categories')).category,
		});
	}

	//status: ok
	public static validateDataForMiddlewareDeleteCategory(body: { [key: string]: string | object }): void {
		this.executeChecker({
			id: Object(this.sqlMask(body, 'categories')).id,
		});
	}

	//*NEW SECTION
	//status: ok
	public static async validateDataForMiddlewarePostProduct(body: { [key: string]: string | object }, file: Express.Multer.File | undefined): Promise<void> {
		this.executeChecker({
			category: Object(this.sqlMask(body, 'products')).category,
			name: Object(this.sqlMask(body, 'products')).name,
			price: Object(this.sqlMask(body, 'products')).price,
			off: Object(this.sqlMask(body, 'products')).off,
			installment: Object(this.sqlMask(body, 'products')).installment,
			whatsapp: Object(this.sqlMask(body, 'products')).whatsapp,
			message: Object(this.sqlMask(body, 'products')).message,
		});

		const [query]: [mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT category FROM categories WHERE id = ?;', [Object(body).category]);

		this.executeChecker({
			category: Object(query).length === 1,
		});

		Object(file).originalname = this.generateRandomBytes();

		try {
			Object(file).buffer = await this.sharpImage(Object(file).buffer, 800, 800, 'contain');
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
		this.executeChecker({
			id: Object(this.sqlMask(body, 'products')).id,
		});
	}

	//*NEW SECTION
	public static async validateDataForMiddlewarePutText(body: { [key: string]: string | object }): Promise<void> {}
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

			const [query]: [mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]] | undefined = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT token FROM auth WHERE user = ? AND token = ? AND id = ?;', [Object(headers).authorization.user, Object(headers).authorization.token, 'only']);

			if (Object(query).length !== 1) {
				throw { type: 403, message: "Oops, something wasn't right", check: 'authorization' };
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

			await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'INSERT IGNORE INTO categories (category) VALUES (?);', [Object(body).category]);

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

			const [query1]: [mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT category FROM categories WHERE id = ?;', [Object(body).id]);

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
			const body: { [key: string]: string | Object } = req.body;

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}
}
