import express from 'express';
import AdminModules from '../adminModules';
import multer from 'multer';
import sharp from 'sharp';
import crypto from 'crypto';
import {
	GlobalMiddlewareModules,
	GlobalS3Modules,
	GlobalMySQLModules,
} from '../../../globalModules';

class Support {
	public static readonly textMask = {
		header: {
			title: (title: string) => {
				AdminModules.checkLength(title, 5, 50, 'title');
			},
			description: (description: string) => {
				AdminModules.checkLength(description, 5, 255, 'description');
			},
			color: (data: string) => {
				AdminModules.checkLength(data, 7, 7, 'color');
			},
		},
		propagandas: {
			imagesContext: (imagesContext: Array<string>) => {
				AdminModules.checkType(imagesContext, 'object', 'images context');
				AdminModules.checkLength(imagesContext, 2, 2, 'images context');

				if (
					JSON.stringify(imagesContext.sort()) !==
					JSON.stringify(['bigImage', 'smallImage'])
				) {
					throw {
						status: 400,
						message:
							'images context is missing required data, please provide the data correctly',
					};
				}
			},
		},
		categories: {
			name: (name: string) => {
				AdminModules.checkType(name, 'string', 'name');
				AdminModules.checkLength(name, 5, 50, 'name');
			},
		},
		products: {
			category: async (category: string) => {
				AdminModules.checkType(category, 'string', 'category');

				const [query] = await GlobalMySQLModules.query(
					'SELECT name FROM categories WHERE id = ?;',
					[category, category],
				);

				if (Object(query).length === 0) {
					throw {
						status: 400,
						message:
							'category ' +
							category +
							' does not exist, please provide the data correctly',
					};
				}
			},
			name: (name: string) => {
				AdminModules.checkType(name, 'string', 'name');
				AdminModules.checkLength(name, 5, 50, 'name');
			},
			price: (price: string) => {
				AdminModules.checkType(price, 'string', 'price');
				AdminModules.checkNumber(price, 'price');
				AdminModules.checkValue(price, 0, 999999999999999, 'price');
			},
			off: (off: string) => {
				AdminModules.checkType(off, 'string', 'off');
				AdminModules.checkNumber(off, 'off');
				AdminModules.checkValue(off, 0, 100, 'off');
			},
			installment: (installment: string) => {
				AdminModules.checkType(installment, 'string', 'installment');
				AdminModules.checkLength(installment, 0, 50, 'installment');
			},
			whatsapp: (whatsapp: string) => {
				AdminModules.checkType(whatsapp, 'string', 'whatsapp');
				AdminModules.checkNumber(whatsapp, 'whatsapp');
				AdminModules.checkLength(whatsapp, 13, 13, 'whatsapp');
			},
			message: (message: string) => {
				AdminModules.checkType(message, 'string', 'mesage');
				AdminModules.checkLength(message, 0, 255, 'message');
			},
		},
		footer: {
			title: (title: string) => {
				AdminModules.checkLength(title, 5, 50, 'title');
			},
			text: (text: string) => {
				AdminModules.checkLength(text, 5, 255, 'text');
			},
			whatsapp: (whatsapp: string) => {
				AdminModules.checkNumber(whatsapp, 'whatsapp');
				AdminModules.checkLength(whatsapp, 13, 13, 'whatsapp');
			},
			facebook: (facebook: string) => {
				AdminModules.checkLength(facebook, 5, 50, 'facebook');
			},
			instagram: (instagram: string) => {
				AdminModules.checkLength(instagram, 5, 50, 'instagram');
			},
			storeInfo: (storeInfo: string) => {
				AdminModules.checkLength(storeInfo, 5, 50, 'store info');
			},
			completeStoreInfo: (completeStoreInfo: string) => {
				AdminModules.checkLength(
					completeStoreInfo,
					5,
					50,
					'complete store info',
				);
			},
		},
	};

	public static readonly imageMask = {
		header: {
			icon: async (file: Express.Multer.File | undefined) =>
				await this.sharpFile(file, 50, 50, 'contain'),
			logo: async (file: Express.Multer.File | undefined) =>
				await this.sharpFile(file, 437, 36, 'contain'),
		},
		propagandas: {
			bigImage: async (file: Express.Multer.File | undefined) =>
				await this.sharpFile(file, 1920, 460, 'contain'),
			smallImage: async (file: Express.Multer.File | undefined) =>
				await this.sharpFile(file, 1080, 1080, 'contain'),
		},
		products: {
			image: async (file: Express.Multer.File | undefined) =>
				await this.sharpFile(file, 1080, 1080, 'cover'),
		},
	};

	private static async sharpFile(
		file: Express.Multer.File | undefined,
		width: number,
		height: number,
		fit: keyof sharp.FitEnum,
	) {
		file!.originalname = crypto
			.randomBytes(128)
			.toString('hex')
			.substring(0, 255);

		try {
			file!.buffer = await sharp(file!.buffer)
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
					message: 'Please provide valid images to fulfill the request',
				};
			}

			throw err;
		}
	}

	public static async validateDataForMiddlewarePostPropaganda(
		imagesContext: Array<string>,
		files:
			| { [fieldname: string]: Express.Multer.File[] }
			| Express.Multer.File[]
			| undefined,
	) {
		Support.textMask.propagandas.imagesContext(imagesContext);

		await this.imageMask.propagandas.bigImage(
			Object(files)[imagesContext.indexOf('bigImage')],
		);

		await this.imageMask.propagandas.smallImage(
			Object(files)[imagesContext.indexOf('smallImage')],
		);
	}

	public static async validateDataForMiddlewarePostCategory(name: string) {
		this.textMask.categories.name(name);

		const [query] = await GlobalMySQLModules.query(
			'SELECT name FROM categories WHERE name = ?',
			[name],
		);

		if (Object(query).length !== 0) {
			throw {
				status: 400,
				message: name + ' already exists, please provide the data correctly',
			};
		}
	}

	public static async validateDataForMiddlewarePostProduct(
		category: string,
		name: string,
		price: string,
		off: string,
		installment: string,
		whatsapp: string,
		message: string,
		file: Express.Multer.File | undefined,
	) {
		await this.textMask.products.category(category);
		this.textMask.products.name(name);
		this.textMask.products.price(price);
		this.textMask.products.off(off);
		this.textMask.products.installment(installment);
		this.textMask.products.whatsapp(whatsapp);
		this.textMask.products.message(message);
		await this.imageMask.products.image(file);
	}

	public static validateDataForMiddlewarePutText(
		id: string,
		data: string,
		table: string,
		column: string,
	) {
		AdminModules.checkType(id, 'string', 'id');

		AdminModules.checkType(data, 'string', column);

		Object(this.textMask)[table][column](data);
	}

	public static async validateDataForMiddlewarePutImage(
		id: string,
		file: Express.Multer.File | undefined,
		table: string,
		column: string,
	) {
		AdminModules.checkType(id, 'string', 'id');

		await Object(Support.imageMask)[table][column](file);
	}
}

export default class LocalModules {
	public static readonly multer = multer({ storage: multer.memoryStorage() });

	public static async middlewareCheckToken(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			let authorization = String(req.headers.authorization).replace(
				'Bearer ',
				'',
			);

			const [query] = await GlobalMySQLModules.query(
				'SELECT token FROM admin WHERE token = ?;',
				[authorization],
			);

			if (Object(query).length === 0) {
				throw {
					status: 401,
					message: 'unthorized',
				};
			}

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static middlewareUploadFiles(
		minCount: number,
		maxCount: number,
	): (
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) => void {
		return async function (
			req: express.Request,
			res: express.Response,
			next: express.NextFunction,
		) {
			var upload;
			if (maxCount === 1) {
				upload = LocalModules.multer.single('file');
			} else {
				upload = LocalModules.multer.array('files', maxCount);
			}

			upload(req, res, (err: any) => {
				try {
					if (
						err instanceof multer.MulterError ||
						(maxCount === 1 && typeof req.file !== 'object') ||
						(maxCount > 1 && Object(req).files.length < minCount)
					) {
						throw {
							status: 400,
							message:
								'Please provide the appropriate number of images to fulfill the request',
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

	public static async middlewarePostPropaganda(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			const imagesContext = req.body.imagesContext;
			const files = req.files;

			await Support.validateDataForMiddlewarePostPropaganda(
				imagesContext,
				files,
			);

			const bigImage = Object(files)[imagesContext.indexOf('bigImage')];
			const smallImage = Object(files)[imagesContext.indexOf('smallImage')];

			await GlobalS3Modules.uploadFileToS3Bucket(
				bigImage.buffer,
				bigImage.originalname,
				bigImage.mimetype,
			);

			await GlobalS3Modules.uploadFileToS3Bucket(
				smallImage.buffer,
				smallImage.originalname,
				smallImage.mimetype,
			);

			await GlobalMySQLModules.query(
				'INSERT INTO propagandas (bigImage, smallImage) VALUES (?, ?)',
				[bigImage.originalname, smallImage.originalname],
			);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewareDeletePropaganda(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			const id = req.body.id;

			AdminModules.checkType(id, 'string', 'id');

			const [query] = await GlobalMySQLModules.query(
				'SELECT bigImage, smallImage FROM propagandas WHERE id = ?',
				[id],
			);

			if (Object(query).length === 0) {
				return next();
			}

			await GlobalS3Modules.deleteFileFromS3Bucket(Object(query)[0].bigImage);
			await GlobalS3Modules.deleteFileFromS3Bucket(Object(query)[0].smallImage);

			await GlobalMySQLModules.query('DELETE FROM propagandas WHERE id = ?', [
				id,
			]);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewarePostCategory(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			const name = req.body.name;

			await Support.validateDataForMiddlewarePostCategory(name);

			await GlobalMySQLModules.query(
				'INSERT INTO categories (name) VALUES (?)',
				[name],
			);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewareDeleteCategory(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			const id = req.body.id;

			AdminModules.checkType(id, 'string', 'id');

			await GlobalMySQLModules.query('DELETE FROM categories WHERE id = ?;', [
				id,
			]);

			const [query] = await GlobalMySQLModules.query(
				'SELECT image FROM products WHERE category = ?',
				[id],
			);

			await GlobalMySQLModules.query(
				'DELETE FROM products WHERE category = ?',
				[id],
			);

			for (let c = 0; c < Object(query).length; c++) {
				await GlobalS3Modules.deleteFileFromS3Bucket(Object(query)[c].image);
			}

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewarePostProduct(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			const { category, name, price, off, installment, whatsapp, message } =
				req.body;
			const file = req.file;

			await Support.validateDataForMiddlewarePostProduct(
				category,
				name,
				price,
				off,
				installment,
				whatsapp,
				message,
				file,
			);

			await GlobalS3Modules.uploadFileToS3Bucket(
				file!.buffer,
				file!.originalname,
				file!.mimetype,
			);

			await GlobalMySQLModules.query(
				'INSERT INTO products (category, name, image, price, off, installment, whatsapp, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
				[
					category,
					name,
					file!.originalname,
					price,
					off,
					installment,
					whatsapp,
					message,
				],
			);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewareDeleteProduct(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			const id = req.body.id;

			AdminModules.checkType(id, 'string', 'id');

			const [query] = await GlobalMySQLModules.query(
				'SELECT id, image FROM products WHERE id = ?;',
				[id],
			);

			if (Object(query).length === 0) {
				return next();
			}

			await GlobalMySQLModules.query('DELETE FROM products WHERE id = ?;', [
				id,
			]);

			await GlobalS3Modules.deleteFileFromS3Bucket(Object(query)[0].image);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewarePutText(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			const url = req.originalUrl.split('/');
			const table = String(url[4]);
			const column = String(url[5]);
			const data = req.body[column];
			const id = req.body.id;

			Support.validateDataForMiddlewarePutText(id, data, table, column);

			await GlobalMySQLModules.query(
				'UPDATE ' + table + ' SET ' + column + ' = ? WHERE id = ?;',
				[data, id],
			);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewarePutImage(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			const url = req.originalUrl.split('/');
			const table = String(url[4]);
			const column = String(url[5]);
			const file = req.file;
			const id = req.body.id;

			await Support.validateDataForMiddlewarePutImage(id, file, table, column);

			const [query] = await GlobalMySQLModules.query(
				'SELECT ' + column + ' FROM ' + table + ' WHERE id = ?',
				[id],
			);

			if (Object(query).length === 0) {
				return next();
			}

			await GlobalS3Modules.uploadFileToS3Bucket(
				file!.buffer,
				Object(query)[0][column],
				file!.mimetype,
			);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}
}
