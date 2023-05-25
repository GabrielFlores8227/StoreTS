import express from 'express';
import { GlobalSqlModules, GlobalS3Modules, GlobalMiddlewareModules } from '../../globalModules';
import GlobalAdminModules from '../globalAdminModules';
import multer from 'multer';
import sharp from 'sharp';
import { randomBytes, createHash } from 'crypto';
import { IncomingHttpHeaders } from 'http';

class InputMask {
	/**
	 * Represents the image masks for various sections.
	 */
	public static readonly imageMask = {
		header: {
			icon: {
				/**
				 * Validates and resizes the icon image file.
				 * @param file The image file to validate and resize.
				 * @param width The desired width of the image.
				 * @param height The desired height of the image.
				 * @param fit The desired fit mode for the image.
				 */
				sharpFile: async (file: Express.Multer.File | undefined) => await this.sharpFile(file, 50, 50, 'contain'),
			},
			logo: {
				/**
				 * Validates and resizes the logo image file.
				 * @param file The image file to validate and resize.
				 * @param width The desired width of the image.
				 * @param height The desired height of the image.
				 * @param fit The desired fit mode for the image.
				 */
				sharpFile: async (file: Express.Multer.File | undefined) => await this.sharpFile(file, 437, 36, 'contain'),
			},
		},
		propagandas: {
			bigImage: {
				/**
				 * Validates and resizes the big propaganda image file.
				 * @param file The image file to validate and resize.
				 * @param width The desired width of the image.
				 * @param height The desired height of the image.
				 * @param fit The desired fit mode for the image.
				 */
				sharpFile: async (file: Express.Multer.File | undefined) => await this.sharpFile(file, 1920, 460, 'contain'),
			},
			smallImage: {
				/**
				 * Validates and resizes the small propaganda image file.
				 * @param file The image file to validate and resize.
				 * @param width The desired width of the image.
				 * @param height The desired height of the image.
				 * @param fit The desired fit mode for the image.
				 */
				sharpFile: async (file: Express.Multer.File | undefined) => await this.sharpFile(file, 1080, 1080, 'contain'),
			},
		},
		products: {
			image: {
				/**
				 * Validates and resizes the product image file.
				 * @param file The image file to validate and resize.
				 * @param width The desired width of the image.
				 * @param height The desired height of the image.
				 * @param fit The desired fit mode for the image.
				 */
				sharpFile: async (file: Express.Multer.File | undefined) => await this.sharpFile(file, 1080, 1080, 'contain'),
			},
		},
	};

	/**
	 * Masks for executing various text checks.
	 */
	public static readonly textMask = {
		authorization: {
			/**
			 * Executes the authorization checker.
			 * @param headers The incoming HTTP headers.
			 * @returns The result of the authorization check.
			 */
			executeChecker: (headers: IncomingHttpHeaders) => this.checkAuthorization(headers),
		},
		id: {
			/**
			 * Executes the ID checker.
			 * @param body The body containing the ID.
			 * @returns The result of the ID check.
			 */
			executeChecker: (body: { id: string }) => this.idChecker(body),
		},
		ids: {
			/**
			 * Executes the IDs checker.
			 * @param table The name of the table to check.
			 * @param body The body containing the IDs.
			 * @returns The result of the IDs check.
			 */
			executeChecker: async (table: string, body: { ids: string[] }) => await this.idsChecker(table, body),
		},
		password: {
			executeChecker: (body: { oldPassword: string; newPassword: string }) => this.passwordChecker(body),
		},
		header: {
			/**
			 * Executes the header checker.
			 * @param body The body containing the header information.
			 * @returns The result of the header check.
			 */
			executeChecker: (body: { title: string; description: string; color: string }) => this.headerChecker(body),
		},
		propagandas: {
			/**
			 * Executes the propagandas checker.
			 * @param body The body containing the images context.
			 * @returns The result of the propagandas check.
			 */
			executeChecker: (body: { imagesContext: string[] }) => this.propagandasChecker(body),
		},
		categories: {
			/**
			 * Executes the categories checker.
			 * @param body The body containing the category name.
			 * @returns The result of the categories check.
			 */
			executeChecker: (body: { name: string }) => this.categoriesChecker(body),
		},
		products: {
			/**
			 * Executes the products checker.
			 * @param body The body containing the product information.
			 * @returns The result of the products check.
			 */
			executeChecker: async (body: { category: string; name: string; price: string; off: string; installment: string; whatsapp: string; message: string }) => await this.productsChecker(body),
		},
		footer: {
			/**
			 * Executes the footer checker.
			 * @param body The body containing the footer information.
			 * @returns The result of the footer check.
			 */
			executeChecker: (body: { title: string; text: string; whatsapp: string; instagram: string; facebook: string; location: string; storeInfo: string; completeStoreInfo: string }) => this.footerChecker(body),
		},
	};

	/**
	 * Resizes and processes the image file using the sharp library.
	 * @param file The image file to resize and process.
	 * @param width The desired width of the image.
	 * @param height The desired height of the image.
	 * @param fit The desired fit mode for the image.
	 * @throws Will throw an error if the provided image file is invalid or the resizing process fails.
	 */
	private static async sharpFile(file: Express.Multer.File | undefined, width: number, height: number, fit: keyof sharp.FitEnum) {
		file!.originalname = randomBytes(128).toString('hex').substring(0, 255);

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
					message: 'Please provide valid image(s) to fulfill the request',
				};
			}

			throw err;
		}
	}

	/**
	 * Checks the authorization header in the incoming HTTP headers.
	 * @param headers The incoming HTTP headers object.
	 * @returns An object indicating if the authorization header is present or not.
	 */
	private static checkAuthorization(headers: IncomingHttpHeaders) {
		return {
			authorization: typeof headers.authorization === 'string',
		};
	}

	/**
	 * Checks the "id" property in the request body.
	 * @param body The request body object.
	 * @returns An object indicating if the "id" property is present or not.
	 */
	private static idChecker(body: { id: string }) {
		return {
			id: typeof body.id === 'string',
		};
	}

	/**
	 * Checks the "ids" property in the request body against the provided table.
	 * @param table The table name to query against.
	 * @param body The request body object.
	 * @returns An object indicating if the "ids" property matches the values in the table.
	 */
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

	private static passwordChecker(body: { oldPassword: string; newPassword: string }) {
		return {
			oldPassword: typeof body.oldPassword === 'string' && body.oldPassword.length > 1,
			newPassword: typeof body.newPassword === 'string' && body.newPassword.length > 1,
		};
	}

	/**
	 * Checks the properties of the header in the request body.
	 * @param body The request body object containing the header properties.
	 * @returns An object indicating if the header properties are valid.
	 */
	private static headerChecker(body: { title: string; description: string; color: string }) {
		return {
			title: typeof body.title === 'string' && body.title.length >= 1 && body.title.length <= 50,
			description: typeof body.description === 'string' && body.description.length >= 1 && body.description.length <= 255,
			color: typeof body.color === 'string' && body.color.length === 7,
		};
	}

	/**
	 * Checks the properties of the propagandas in the request body.
	 * @param body The request body object containing the propagandas properties.
	 * @returns An object indicating if the propagandas properties are valid.
	 */
	private static propagandasChecker(body: { imagesContext: string[] }) {
		return {
			imagesContext: typeof body.imagesContext === 'object' && JSON.stringify(['bigImage', 'smallImage'].sort()) === JSON.stringify(body.imagesContext.sort()),
		};
	}

	/**
	 * Checks the properties of the categories in the request body.
	 * @param body The request body object containing the categories properties.
	 * @returns An object indicating if the categories properties are valid.
	 */
	private static categoriesChecker(body: { name: string }) {
		return {
			name: typeof body.name === 'string' && body.name.length >= 1 && body.name.length <= 50,
		};
	}

	/**
	 * Checks the properties of the products in the request body.
	 * @param body The request body object containing the products properties.
	 * @returns An object indicating if the products properties are valid.
	 */
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

	/**
	 * Checks the properties of the footer in the request body.
	 * @param body The request body object containing the footer properties.
	 * @returns An object indicating if the footer properties are valid.
	 */
	private static footerChecker(body: { title: string; text: string; whatsapp: string; instagram: string; facebook: string; location: string; storeInfo: string; completeStoreInfo: string }) {
		return {
			title: typeof body.title === 'string' && body.title.length > 1 && body.title.length <= 50,
			text: typeof body.text === 'string' && body.text.length > 1 && body.text.length <= 255,
			whatsapp: typeof body.whatsapp === 'string' && !isNaN(Number(body.whatsapp)) && body.whatsapp.length === 13,
			instagram: typeof body.instagram === 'string' && body.instagram.charAt(0) === '@' && body.instagram.length > 1 && body.instagram.length <= 50,
			facebook: typeof body.facebook === 'string' && body.facebook.charAt(0) === '@' && body.facebook.length > 1 && body.facebook.length <= 50,
			location: typeof body.location === 'string' && body.location.length > 1 && body.location.length <= 65535,
			storeInfo: typeof body.storeInfo === 'string' && body.storeInfo.length > 1 && body.storeInfo.length <= 50,
			completeStoreInfo: typeof body.completeStoreInfo === 'string' && body.completeStoreInfo.length > 1 && body.completeStoreInfo.length <= 100,
		};
	}
}

class LocalModulesUtil {
	/**
	 * Validates the data form middleware and checks the authorization headers.
	 * @param headers The request headers object.
	 */
	public static validateDataFormMiddlewareCheckAuth(headers: IncomingHttpHeaders) {
		const checker = InputMask.textMask.authorization.executeChecker(headers);

		GlobalAdminModules.executeChecker(checker, {
			status: 401,
			message: 'Unauthorized',
		});

		headers.authorization = headers.authorization!.replace('Bearer ', '');
	}

	public static validateDataForMiddlewarePostPassword(body: { newPassword: string; oldPassword: string }) {
		const checker = InputMask.textMask.password.executeChecker(body);

		GlobalAdminModules.executeChecker(checker);
	}

	/**
	 * Validates the data for the middleware used in POST propaganda requests.
	 * @param body The request body object.
	 * @param files The uploaded files object.
	 */
	public static async validateDataForMiddlewarePostPropaganda(body: { imagesContext: string[] }, files: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined) {
		const checker = InputMask.textMask.propagandas.executeChecker(body);

		GlobalAdminModules.executeChecker(checker);

		const bigImage = Object(files)[body.imagesContext.indexOf('bigImage')];
		const smallImage = Object(files)[body.imagesContext.indexOf('smallImage')];

		await InputMask.imageMask.propagandas.bigImage.sharpFile(bigImage);
		await InputMask.imageMask.propagandas.smallImage.sharpFile(smallImage);
	}

	/**
	 * Validates the data for the middleware used in DELETE propaganda requests.
	 * @param body The request body object containing the ID of the propaganda to delete.
	 */
	public static validateDataForMiddlewareDeletePropaganda(body: { id: string }) {
		const checker = InputMask.textMask.id.executeChecker(body);

		GlobalAdminModules.executeChecker(checker);
	}

	/**
	 * Validates the data for the middleware used in POST category requests.
	 * @param body The request body object containing the name of the category.
	 */
	public static validateDataForMiddlewarePostCategory(body: { name: string }) {
		const checker = InputMask.textMask.categories.executeChecker(body);

		GlobalAdminModules.executeChecker(checker);
	}

	/**
	 * Validates the data for the middleware used in DELETE category requests.
	 * @param body The request body object containing the ID of the category.
	 */
	public static validateDataForMiddlewareDeleteCategory(body: { id: string }) {
		const checker = InputMask.textMask.id.executeChecker(body);

		GlobalAdminModules.executeChecker(checker);
	}

	/**
	 * Validates the data for the middleware used in POST product requests.
	 * @param body The request body object containing product details.
	 * @param file The image file for the product.
	 */
	public static async validateDataForMiddlewarePostProduct(body: { category: string; name: string; price: string; off: string; installment: string; whatsapp: string; message: string }, file: Express.Multer.File | undefined) {
		const checker = await InputMask.textMask.products.executeChecker(body);

		GlobalAdminModules.executeChecker(checker);

		await InputMask.imageMask.products.image.sharpFile(file);
	}

	/**
	 * Validates the data for the middleware used in DELETE product requests.
	 * @param body The request body object containing the product ID.
	 */
	public static validateDataForMiddlewareDeleteProduct(body: { id: string }) {
		const checker = InputMask.textMask.id.executeChecker(body);

		GlobalAdminModules.executeChecker(checker);
	}

	/**
	 * Validates the data for the middleware used in PUT text requests.
	 * @param table The table name for the text.
	 * @param column The column name for the text.
	 * @param body The request body object containing the text ID and text value.
	 */
	public static async validateDataForMiddlewarePutText(table: string, column: string, body: { id: string; [key: string]: string }) {
		const checker1 = InputMask.textMask.id.executeChecker(body);

		GlobalAdminModules.executeChecker(checker1);

		const { [column]: columnValue } = await Object(InputMask).textMask[table].executeChecker(body);

		GlobalAdminModules.executeChecker({ [column]: columnValue });
	}

	/**
	 * Validates the data for the middleware used in PUT image requests.
	 * @param table The table name for the image.
	 * @param column The column name for the image.
	 * @param body The request body object containing the image ID.
	 * @param file The image file to validate and resize.
	 */
	public static async validateDataForMiddlewarePutImage(table: string, column: string, body: { id: string }, file: Express.Multer.File | undefined) {
		const checker = InputMask.textMask.id.executeChecker(body);

		GlobalAdminModules.executeChecker(checker);

		await Object(InputMask).imageMask[table][column].sharpFile(file);
	}

	/**
	 * Validates the data for the middleware used in PUT position requests.
	 * @param table The table name for the positions.
	 * @param body The request body object containing the IDs of the positions.
	 */
	public static async validateDataForMiddlewarePutPosition(table: string, body: { ids: string[] }) {
		const checker = await InputMask.textMask.ids.executeChecker(table, body);

		GlobalAdminModules.executeChecker(checker);
	}
}

export default class LocalModules {
	/**
	 * Creates a middleware function to handle file uploads.
	 * @param minCount The minimum number of files required.
	 * @param maxCount The maximum number of files allowed.
	 * @returns The middleware function to handle file uploads.
	 */
	public static middlewareUploadFiles(minCount: number, maxCount: number): (req: express.Request, res: express.Response, next: express.NextFunction) => void {
		return async function (req: express.Request, res: express.Response, next: express.NextFunction) {
			var upload;
			if (maxCount === 1) {
				upload = GlobalMiddlewareModules.multer.single('file');
			} else {
				upload = GlobalMiddlewareModules.multer.array('files', maxCount);
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

	/**
	 * Middleware function to perform authentication checks.
	 * @param req The Express request object.
	 * @param res The Express response object.
	 * @param next The next middleware function.
	 */
	public static async middlewareCheckAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			const headers = req.headers;

			LocalModulesUtil.validateDataFormMiddlewareCheckAuth(headers);

			const [query] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT token FROM auth WHERE token = ? AND id = ?;', [headers!.authorization!, 'only']);

			if (Object(query).length !== 1) {
				throw { status: 401, message: 'Unauthorized' };
			}

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewarePostPassword(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			const body = req.body;

			LocalModulesUtil.validateDataForMiddlewarePostPassword(body);

			const hashedOldPassword = createHash('sha512').update(String(body.oldPassword)).digest('hex');
			const hashedNewPassword = createHash('sha512').update(String(body.newPassword)).digest('hex');

			const [query] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT password FROM auth WHERE id = ? AND password = ?', ['only', hashedOldPassword]);

			if (Object(query).length !== 1) {
				throw { status: 401, message: 'Oops! password is incorrect' };
			}

			await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'UPDATE auth SET password = ? WHERE id = ?', [hashedNewPassword, 'only']);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	/**
	 * Middleware function to handle a POST request to create a propaganda.
	 * @param req The Express request object.
	 * @param res The Express response object.
	 * @param next The next middleware function.
	 */
	public static async middlewarePostPropaganda(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			const body = req.body;
			const files = req.files;

			await LocalModulesUtil.validateDataForMiddlewarePostPropaganda(body, files);

			const bigImage: Express.Multer.File = Object(files)[Object(body).imagesContext.indexOf('bigImage')];
			const smallImage: Express.Multer.File = Object(files)[Object(body).imagesContext.indexOf('smallImage')];

			await GlobalS3Modules.uploadFileToS3Bucket(bigImage.buffer, bigImage.originalname, bigImage.mimetype);
			await GlobalS3Modules.uploadFileToS3Bucket(smallImage.buffer, smallImage.originalname, smallImage.mimetype);

			await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'INSERT INTO propagandas (bigImage, smallImage) VALUES (?, ?);', [bigImage.originalname, smallImage.originalname]);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	/**
	 * Middleware function to handle a DELETE request to delete a propaganda.
	 * @param req The Express request object.
	 * @param res The Express response object.
	 * @param next The next middleware function.
	 */
	public static async middlewareDeletePropaganda(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			const body = req.body;

			LocalModulesUtil.validateDataForMiddlewareDeletePropaganda(body);

			const [query] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT bigImage, smallImage FROM propagandas WHERE id = ?;', [body.id]);

			if (Object(query).length !== 1) {
				return next();
			}

			await GlobalS3Modules.deleteFileFromS3Bucket(Object(query)[0].bigImage);
			await GlobalS3Modules.deleteFileFromS3Bucket(Object(query)[0].smallImage);

			await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'DELETE FROM propagandas WHERE id = ?;', [body.id]);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	/**
	 * Middleware function to handle a POST request to create a new category.
	 * @param req The Express request object.
	 * @param res The Express response object.
	 * @param next The next middleware function.
	 */
	public static async middlewarePostCategory(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			const body = req.body;

			LocalModulesUtil.validateDataForMiddlewarePostCategory(body);

			await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'INSERT IGNORE INTO categories (name) VALUES (?);', [body.name]);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	/**
	 * Middleware function to handle a DELETE request to delete a category.
	 * @param req The Express request object.
	 * @param res The Express response object.
	 * @param next The next middleware function.
	 */
	public static async middlewareDeleteCategory(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			const body = req.body;

			LocalModulesUtil.validateDataForMiddlewareDeleteCategory(body);

			const [query1] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT id FROM categories WHERE id = ?;', [body.id]);

			if (Object(query1).length !== 1) {
				return next();
			}

			const [query2] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT id, image FROM products WHERE category = ?;', [body.id]);

			Object(query2).forEach(async (row: { id: number; image: string }) => {
				await GlobalS3Modules.deleteFileFromS3Bucket(row.image);
				await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'DELETE FROM products WHERE id = ?;', [String(row.id)]);
			});

			await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'DELETE FROM categories WHERE id = ?;', [body.id]);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	/**
	 * Middleware function to handle a POST request to create a new product.
	 * @param req The Express request object.
	 * @param res The Express response object.
	 * @param next The next middleware function.
	 */
	public static async middlewarePostProduct(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			const body = req.body;
			const file = req.file;

			await LocalModulesUtil.validateDataForMiddlewarePostProduct(body, file);

			await GlobalS3Modules.uploadFileToS3Bucket(file!.buffer, file!.originalname, file!.mimetype!);

			await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'INSERT INTO products (category, name, image, price, off, installment, whatsapp, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?);', [body.category, body.name, file!.originalname, body.price, body.off, body.installment, body.whatsapp, body.message]);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	/**
	 * Middleware function to handle a DELETE request to delete a product.
	 * @param req The Express request object.
	 * @param res The Express response object.
	 * @param next The next middleware function.
	 */
	public static async middlewareDeleteProduct(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			const body = req.body;

			LocalModulesUtil.validateDataForMiddlewareDeleteProduct(body);

			const [query] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT image FROM products WHERE id = ?;', [body.id]);

			if (Object(query).length !== 1) {
				return next();
			}

			await GlobalS3Modules.deleteFileFromS3Bucket(Object(query)[0].image);

			await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'DELETE FROM products WHERE id = ?;', [body.id]);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	/**
	 * Middleware function to handle a PUT request to update a specific column of a table.
	 * @param req The Express request object.
	 * @param res The Express response object.
	 * @param next The next middleware function.
	 */
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

	/**
	 * Middleware function to handle a PUT request to update an image column of a table.
	 * @param req The Express request object.
	 * @param res The Express response object.
	 * @param next The next middleware function.
	 */
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

			await GlobalS3Modules.uploadFileToS3Bucket(file!.buffer, Object(query)[0][column], file!.mimetype);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	/**
	 * Middleware function to handle a PUT request to update the position of rows in a table.
	 * @param req The Express request object.
	 * @param res The Express response object.
	 * @param next The next middleware function.
	 */
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

	/**
	 * Returns a middleware function that sends a JSON response with the specified status and message.
	 * @param status The HTTP status code for the response.
	 * @returns The middleware function that sends the response.
	 */
	public static middlewareSendResponse(status: number): (req: express.Request, res: express.Response, next: express.NextFunction) => void {
		return function (_: express.Request, res: express.Response) {
			res.json({
				status: status,
				message: 'ok',
			});
		};
	}
}
