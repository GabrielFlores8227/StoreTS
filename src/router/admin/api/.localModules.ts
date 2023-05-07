import express, { NextFunction } from 'express';
import { GlobalSqlModules, GlobalS3Modules, GlobalMiddlewareModules } from '../../.globalModules';
import mysql2 from 'mysql2/promise';
import multer from 'multer';
import sharp from 'sharp';
import crypto from 'crypto';

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
	private static executeChecker(checker: { [key: string]: boolean }): void {
		Object.keys(checker).forEach((key: string) => {
			if (Object(checker)[key]) {
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
	public static validateDataFormMiddlewareCheckToken(body: { [key: string]: string | Object }): void {
		this.executeChecker({
			token: !Object(body).token || typeof Object(body).token !== 'string',
		});
	}

	//*NEW SECTION
	//status: ok
	public static async validateDataForMiddlewarePostPropaganda(body: { [key: string]: string | object }, files: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined): Promise<void> {
		this.executeChecker({
			imagesContext: !Object(body).imagesContext || JSON.stringify(['bigImage', 'smallImage'].sort()) !== JSON.stringify(Object(body).imagesContext.sort()),
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
	public static async validateDataForMiddlewareDeletePropaganda(body: { [key: string]: string | object }): Promise<void> {
		this.executeChecker({
			id: !Object(body).id || typeof Object(body).id !== 'string',
		});
	}

	public static async validateDataForMiddlewarePostCategory(body: { [key: string]: string | object }): Promise<void> {
		this.executeChecker({
			category: !Object(body).category || typeof Object(body).category !== 'string' || Object(body).category.length < 1 || Object(body).category.length > 50,
		});
	}

	public static async validateDataForMiddlewarePostProduct(body: { [key: string]: string | object }, file: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined): Promise<void> {
		this.executeChecker({
			category: !Object(body).category,
			name: !Object(body).name || typeof Object(body).name !== 'string' || Object(body).name.length < 1 || Object(body).name.length > 50,
			price: !Object(body).price || typeof Object(body).price !== 'string' || !isNaN(Object(body).price) || Number(Object(body).price) < 0,
			off: !Object(body).off || typeof Object(body).off !== 'string' || !isNaN(Object(body).off) || Number(Object(body).off) < 0 || Number(Object(body).off) > 100,
			installment: !Object(body).installment || typeof Object(body).installment !== 'string' || Object(body).installment.length > 50,
			whatsapp: !Object(body).whatsapp || typeof Object(body).whatsapp !== 'string' || isNaN(Object(body).whatsapp) || Object(body).name.length !== 13,
			message: !Object(body).message || typeof Object(body).message !== 'string' || Object(body).message.length > 255,
		});
	}
}

export default class LocalModules {
	//*NEW SECTION
	//status: ok
	public static middlewareUploadFiles(maxCount: number, minCount: number = 0): (req: express.Request, res: express.Response, next: express.NextFunction) => void {
		return function (req: express.Request, res: express.Response, next: express.NextFunction) {
			let upload: express.RequestHandler;
			if (maxCount == 1) {
				upload = GlobalMiddlewareModules.multer.single('file');
			} else {
				upload = GlobalMiddlewareModules.multer.array('files', maxCount);
			}

			upload(req, res, (err: any) => {
				if (err instanceof multer.MulterError || !req.files) {
					GlobalMiddlewareModules.handleMiddlewareError(res, {
						type: 400,
						message: 'Please provide the appropriate number of images to fulfill the request',
						check: maxCount === 1 ? 'file' : 'files',
					});
				}

				if (err) {
					GlobalMiddlewareModules.handleMiddlewareError(res, err);
				}

				return next();
			});
		};
	}

	//*NEW SECTION
	//status: ok
	public static async middlewareCheckToken(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			const body: { [key: string]: string | Object } = req.body;

			LocalModulesUtil.validateDataFormMiddlewareCheckToken(body);

			const [query]: [mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]] | undefined = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT token FROM auth WHERE token = ? AND id = ?;', [Object(body).token, 'only']);

			if (Object(query).length !== 1) {
				throw { type: 403, message: "Oops, something wasn't right", check: 'token' };
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
	public static async middlewarePostPropaganda(req: express.Request, res: express.Response, next: NextFunction): Promise<void> {
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
	public static async middlewareDeletePropaganda(req: express.Request, res: express.Response, next: NextFunction): Promise<void> {
		try {
			const body: { [key: string]: string | Object } = req.body;

			await LocalModulesUtil.validateDataForMiddlewareDeletePropaganda(body);

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
	public static async middlewarePostCategory(req: express.Request, res: express.Response, next: NextFunction): Promise<void> {
		try {
			const body: { [key: string]: string | Object } = req.body;

			await LocalModulesUtil.validateDataForMiddlewarePostCategory(body);

			await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'INSERT IGNORE INTO categories (category) VALUES (?);', [Object(body).category]);

			return next();
		} catch (err: any) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}
}
