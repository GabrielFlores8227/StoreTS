import express from 'express';
import Admin from 'storets-admin';
import multer from 'multer';
import sharp from 'sharp';
import crypto from 'crypto';
import Middleware from 'storets-middleware';
import Sql from 'storets-sql';
import S3 from 'storets-s3';

class Support {
	public static readonly textMask = {
		header: {
			title: (title: string) => {
				Admin.checkLength(title, 5, 50, 'title');
			},
			description: (description: string) => {
				Admin.checkLength(description, 5, 255, 'description');
			},
			color: (data: string) => {
				Admin.checkLength(data, 7, 7, 'color');
			},
		},
		propagandas: {
			imagesContext: (imagesContext: Array<string>) => {
				Admin.checkType(imagesContext, 'object', 'images context');
				Admin.checkLength(imagesContext, 2, 2, 'images context');

				if (
					JSON.stringify(imagesContext.sort()) !==
					JSON.stringify(['bigImage', 'smallImage'])
				) {
					throw {
						status: 400,
						message: 'images context is missing required data!',
					};
				}
			},
		},
		categories: {
			name: (name: string) => {
				Admin.checkType(name, 'string', 'name');
				Admin.checkLength(name, 5, 50, 'name');
			},
		},
		products: {
			category: async (category: string) => {
				Admin.checkType(category, 'string', 'category');

				const [query] = await Sql.query(
					'SELECT name FROM categories WHERE id = ?;',
					[category, category],
				);

				if (Object(query).length === 0) {
					throw {
						status: 400,
						message: 'category ' + category + ' does not exist!',
					};
				}
			},
			name: (name: string) => {
				Admin.checkType(name, 'string', 'name');
				Admin.checkLength(name, 5, 50, 'name');
			},
			price: (price: string) => {
				Admin.checkType(price, 'string', 'price');
				Admin.checkNumber(price, 'price');
				Admin.checkValue(price, 0, 999999999999999, 'price');
			},
			off: (off: string) => {
				Admin.checkType(off, 'string', 'off');
				Admin.checkNumber(off, 'off');
				Admin.checkValue(off, 0, 100, 'off');
			},
			installment: (installment: string) => {
				Admin.checkType(installment, 'string', 'installment');
				Admin.checkLength(installment, 0, 50, 'installment');
			},
			whatsapp: (whatsapp: string) => {
				Admin.checkType(whatsapp, 'string', 'whatsapp');
				Admin.checkNumber(whatsapp, 'whatsapp');
				Admin.checkLength(whatsapp, 13, 13, 'whatsapp');
			},
			message: (message: string) => {
				Admin.checkType(message, 'string', 'mesage');
				Admin.checkLength(message, 0, 255, 'message');
			},
		},
		footer: {
			title: (title: string) => {
				Admin.checkLength(title, 5, 50, 'title');
			},
			text: (text: string) => {
				Admin.checkLength(text, 5, 255, 'text');
			},
			whatsapp: (whatsapp: string) => {
				Admin.checkNumber(whatsapp, 'whatsapp');
				Admin.checkLength(whatsapp, 13, 13, 'whatsapp');
			},
			facebook: (facebook: string) => {
				Admin.checkLength(facebook, 5, 50, 'facebook');
			},
			instagram: (instagram: string) => {
				Admin.checkLength(instagram, 5, 50, 'instagram');
			},
			storeInfo: (storeInfo: string) => {
				Admin.checkLength(storeInfo, 5, 50, 'store info');
			},
			completeStoreInfo: (completeStoreInfo: string) => {
				Admin.checkLength(completeStoreInfo, 5, 50, 'complete store info');
			},
		},
	};

	public static readonly imageMask = {
		header: {
			icon: async (file: Express.Multer.File | undefined) =>
				await this.sharpFile(file, 'cover', { width: 50, height: 50 }),
			logo: async (file: Express.Multer.File | undefined) =>
				await this.sharpFile(file, 'contain', { height: 70, maxScale: 7.5 }),
		},
		propagandas: {
			bigImage: async (file: Express.Multer.File | undefined) =>
				await this.sharpFile(file, 'cover', { width: 1920, height: 460 }),
			smallImage: async (file: Express.Multer.File | undefined) =>
				await this.sharpFile(file, 'cover', { width: 1080, height: 1080 }),
		},
		products: {
			image: async (file: Express.Multer.File | undefined) =>
				await this.sharpFile(file, 'cover', { width: 1080, height: 1080 }),
		},
	};

	/**
	 * Applies image processing operations using the 'sharp' library to the provided file.
	 * The function trims the image, resizes it based on the specified dimensions and fit mode,
	 * and applies a white background with transparency. It also supports an optional maximum scale constraint.
	 *
	 * @param file - The file object representing the image to be processed.
	 * @param fit - The fit mode for resizing the image. Possible values are 'cover', 'contain', 'fill', 'inside', or 'outside'.
	 * @param size - An object specifying the desired width, height, and/or maximum scale of the image.
	 *               - width: Optional. The desired width of the image.
	 *               - height: Optional. The desired height of the image.
	 *               - maxScale: Optional. The maximum scale constraint for the image, where scale = width / height.
	 * @throws {status: number, message: string} - Throws an error with status code 400 and a message if the image format is unsupported or the buffer is empty.
	 */
	private static async sharpFile(
		file: Express.Multer.File | undefined,
		fit: keyof sharp.FitEnum,
		size: {
			width?: number;
			height?: number;
			maxScale?: number;
		},
	) {
		file!.originalname = crypto
			.randomBytes(128)
			.toString('hex')
			.substring(0, 255);

		try {
			file!.buffer = await sharp(file!.buffer)
				.trim()
				.resize({
					width: size.width,
					height: size.height,
					fit,
					background: { r: 255, g: 255, b: 255, alpha: 0 },
				})
				.toBuffer();

			if (size.maxScale) {
				const imageMetadata = await sharp(file!.buffer).metadata();
				const scale =
					Object(imageMetadata).width / Object(imageMetadata).height;

				if (scale > size.maxScale) {
					file!.buffer = await sharp(file!.buffer)
						.resize({
							width: size.maxScale * Object(imageMetadata).height,
							height: Object(imageMetadata).height,
							fit: 'contain',
							background: { r: 255, g: 255, b: 255, alpha: 0 },
						})
						.toBuffer();
				}
			}
		} catch (err: any) {
			if (
				err.message === 'Input buffer contains unsupported image format' ||
				err.message === 'Input Buffer is empty'
			) {
				throw {
					status: 400,
					message: 'Please provide valid images!',
				};
			}

			throw err;
		}
	}

	/**
	 * Validates data for the middleware handling the "post propaganda" operation.
	 *
	 * @param {Array<string>} imagesContext - The context of the images being validated.
	 * @param {object | object[] | undefined} files - The files to be validated.
	 */
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

	/**
	 * Validates data for the middleware handling the "post category" operation.
	 *
	 * @param {string} name - The name of the category to be validated.
	 */
	public static async validateDataForMiddlewarePostCategory(name: string) {
		this.textMask.categories.name(name);

		const [query] = await Sql.query(
			'SELECT name FROM categories WHERE name = ?;',
			[name],
		);

		if (Object(query).length !== 0) {
			throw {
				status: 400,
				message: name + ' already exists, try to use another name!',
			};
		}
	}

	/**
	 * Validates data for the middleware handling the "post product" operation.
	 *
	 * @param {string} category - The category of the product.
	 * @param {string} name - The name of the product.
	 * @param {string} price - The price of the product.
	 * @param {string} off - The discount/offers for the product.
	 * @param {string} installment - The installment options for the product.
	 * @param {string} whatsapp - The WhatsApp contact for the product.
	 * @param {string} message - The message associated with the product.
	 * @param {Express.Multer.File | undefined} file - The file/image associated with the product.
	 */
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

	/**
	 * Validates data for the middleware handling the "put text" operation.
	 *
	 * @param {string} id - The ID of the text entry.
	 * @param {string} data - The updated text data.
	 * @param {string} table - The table name where the text entry is stored.
	 * @param {string} column - The column name for the text data.
	 */
	public static validateDataForMiddlewarePutText(
		id: string,
		data: string,
		table: string,
		column: string,
	) {
		Admin.checkType(id, 'string', 'id');

		Admin.checkType(data, 'string', column);

		Object(this.textMask)[table][column](data);
	}

	/**
	 * Validates data for the middleware handling the "put image" operation.
	 *
	 * @param {string} id - The ID of the image entry.
	 * @param {Express.Multer.File} file - The updated image file.
	 * @param {string} table - The table name where the image entry is stored.
	 * @param {string} column - The column name for the image file.
	 */
	public static async validateDataForMiddlewarePutImage(
		id: string,
		file: Express.Multer.File | undefined,
		table: string,
		column: string,
	) {
		Admin.checkType(id, 'string', 'id');

		await Object(Support.imageMask)[table][column](file);
	}
}

export default class LocalModules {
	public static readonly multer = multer({ storage: multer.memoryStorage() });

	/**
	 * Middleware function to check the validity of a token in the request headers.
	 * Throws an error if the token is invalid or missing.
	 *
	 * @param {express.Request} req - The Express request object.
	 * @param {express.Response} res - The Express response object.
	 * @param {express.NextFunction} next - The next middleware function.
	 */
	public static async middlewareCheckToken(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			const authorization = String(req.headers.authorization).substring(7);

			const [query] = await Sql.query(
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
			Middleware.handleMiddlewareError(res, err);
		}
	}

	/**
	 * Middleware function for handling file uploads using multer.
	 * Validates the number of uploaded files based on the specified minimum and maximum counts.
	 * Throws an error if the file upload is not valid.
	 *
	 * @param {number} minCount - The minimum number of files required.
	 * @param {number} maxCount - The maximum number of files allowed.
	 * @returns {Function} - The middleware function to handle file uploads.
	 */
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
							message: 'Please provide the required image(s) correctly!',
						};
					} else if (err) {
						throw err;
					}

					return next();
				} catch (err) {
					Middleware.handleMiddlewareError(res, err);
				}
			});
		};
	}

	/**
	 * Middleware function for handling the creation of a propaganda.
	 * Validates the request data for creating a propaganda and performs necessary operations.
	 * Uploads the bigImage and smallImage files to an S3 bucket.
	 * Inserts the file names into the propagandas table in the database.
	 *
	 * @param {express.Request} req - The express request object.
	 * @param {express.Response} res - The express response object.
	 * @param {express.NextFunction} next - The next function to call in the middleware chain.
	 */
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

			await S3.uploadFileToS3Bucket(
				bigImage.buffer,
				bigImage.originalname,
				bigImage.mimetype,
			);

			await S3.uploadFileToS3Bucket(
				smallImage.buffer,
				smallImage.originalname,
				smallImage.mimetype,
			);

			await Sql.query(
				'INSERT INTO propagandas (bigImage, smallImage) VALUES (?, ?);',
				[bigImage.originalname, smallImage.originalname],
			);

			return next();
		} catch (err) {
			Middleware.handleMiddlewareError(res, err);
		}
	}

	/**
	 * Middleware function for handling the deletion of a propaganda.
	 * Validates the request data for deleting a propaganda and performs necessary operations.
	 * Deletes the associated bigImage and smallImage files from the S3 bucket.
	 * Removes the propaganda entry from the propagandas table in the database.
	 *
	 * @param {express.Request} req - The express request object.
	 * @param {express.Response} res - The express response object.
	 * @param {express.NextFunction} next - The next function to call in the middleware chain.
	 */
	public static async middlewareDeletePropaganda(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			const id = req.body.id;

			Admin.checkType(id, 'string', 'id');

			const [query] = await Sql.query(
				'SELECT bigImage, smallImage FROM propagandas WHERE id = ?;',
				[id],
			);

			if (Object(query).length === 0) {
				return next();
			}

			await S3.deleteFileFromS3Bucket(Object(query)[0].bigImage);
			await S3.deleteFileFromS3Bucket(Object(query)[0].smallImage);

			await Sql.query('DELETE FROM propagandas WHERE id = ?;', [id]);

			return next();
		} catch (err) {
			Middleware.handleMiddlewareError(res, err);
		}
	}

	/**
	 * Middleware function for handling the creation of a category.
	 * Validates the request data for creating a category and performs necessary operations.
	 * Inserts the category name into the categories table in the database.
	 *
	 * @param {express.Request} req - The express request object.
	 * @param {express.Response} res - The express response object.
	 * @param {express.NextFunction} next - The next function to call in the middleware chain.
	 */
	public static async middlewarePostCategory(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			const name = req.body.name;

			await Support.validateDataForMiddlewarePostCategory(name);

			await Sql.query('INSERT INTO categories (name) VALUES (?);', [
				name.trim(),
			]);

			return next();
		} catch (err) {
			Middleware.handleMiddlewareError(res, err);
		}
	}

	/**
	 * Middleware function for handling the deletion of a category.
	 * Validates the request data for deleting a category and performs necessary operations.
	 * Deletes the category from the categories table in the database and deletes associated products and their images.
	 *
	 * @param {express.Request} req - The express request object.
	 * @param {express.Response} res - The express response object.
	 * @param {express.NextFunction} next - The next function to call in the middleware chain.
	 */
	public static async middlewareDeleteCategory(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			const id = req.body.id;

			Admin.checkType(id, 'string', 'id');

			await Sql.query('DELETE FROM categories WHERE id = ?;', [id]);

			const [query] = await Sql.query(
				'SELECT image FROM products WHERE category = ?;',
				[id],
			);

			await Sql.query('DELETE FROM products WHERE category = ?;', [id]);

			for (let c = 0; c < Object(query).length; c++) {
				await S3.deleteFileFromS3Bucket(Object(query)[c].image);
			}

			return next();
		} catch (err) {
			Middleware.handleMiddlewareError(res, err);
		}
	}

	/**
	 * Middleware function for handling the creation of a product.
	 * Validates the request data for creating a product and performs necessary operations.
	 * Uploads the product image to an S3 bucket, inserts the product details into the products table in the database.
	 *
	 * @param {express.Request} req - The express request object.
	 * @param {express.Response} res - The express response object.
	 * @param {express.NextFunction} next - The next function to call in the middleware chain.
	 */
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

			await S3.uploadFileToS3Bucket(
				file!.buffer,
				file!.originalname,
				file!.mimetype,
			);

			await Sql.query(
				'INSERT INTO products (category, name, image, price, off, installment, whatsapp, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
				[
					category.trim(),
					name.trim(),
					file!.originalname,
					price.trim(),
					off.trim(),
					installment.trim(),
					whatsapp.trim(),
					message.trim(),
				],
			);

			return next();
		} catch (err) {
			Middleware.handleMiddlewareError(res, err);
		}
	}

	/**
	 * Middleware function for handling the deletion of a product.
	 * Validates the request data for deleting a product and performs necessary operations.
	 * Deletes the product from the database and removes the associated image file from the S3 bucket.
	 *
	 * @param {express.Request} req - The express request object.
	 * @param {express.Response} res - The express response object.
	 * @param {express.NextFunction} next - The next function to call in the middleware chain.
	 */
	public static async middlewareDeleteProduct(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			const id = req.body.id;

			Admin.checkType(id, 'string', 'id');

			const [query] = await Sql.query(
				'SELECT id, image FROM products WHERE id = ?;',
				[id],
			);

			if (Object(query).length === 0) {
				return next();
			}

			await S3.deleteFileFromS3Bucket(Object(query)[0].image);

			await Sql.query('DELETE FROM products WHERE id = ?;', [id]);

			return next();
		} catch (err) {
			Middleware.handleMiddlewareError(res, err);
		}
	}

	/**
	 * Middleware function for handling the update of a text value.
	 * Validates the request data for updating a text value and performs necessary operations.
	 * Updates the specified text column in the given table with the provided data for the given id.
	 *
	 * @param {express.Request} req - The express request object.
	 * @param {express.Response} res - The express response object.
	 * @param {express.NextFunction} next - The next function to call in the middleware chain.
	 */
	public static async middlewarePutText(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			const url = req.originalUrl.split('/');
			const table = String(url[3]);
			const column = String(url[4]);
			const data = req.body[column];
			const id = req.body.id;

			Support.validateDataForMiddlewarePutText(id, data, table, column);

			await Sql.query(
				'UPDATE ' + table + ' SET ' + column + ' = ? WHERE id = ?;',
				[data.trim(), id],
			);

			return next();
		} catch (err) {
			Middleware.handleMiddlewareError(res, err);
		}
	}

	/**
	 * Middleware function for handling the update of an image file.
	 * Validates the request data for updating an image file and performs necessary operations.
	 * Updates the specified image column in the given table with the provided file for the given id.
	 *
	 * @param {express.Request} req - The express request object.
	 * @param {express.Response} res - The express response object.
	 * @param {express.NextFunction} next - The next function to call in the middleware chain.
	 */
	public static async middlewarePutImage(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			const url = req.originalUrl.split('/');
			const table = String(url[3]);
			const column = String(url[4]);
			const file = req.file;
			const id = req.body.id;

			await Support.validateDataForMiddlewarePutImage(id, file, table, column);

			const [query] = await Sql.query(
				'SELECT ' + column + ' FROM ' + table + ' WHERE id = ?;',
				[id],
			);

			if (Object(query).length === 0) {
				return next();
			}

			await S3.uploadFileToS3Bucket(
				file!.buffer,
				Object(query)[0][column],
				file!.mimetype,
			);

			return next();
		} catch (err) {
			Middleware.handleMiddlewareError(res, err);
		}
	}
}
