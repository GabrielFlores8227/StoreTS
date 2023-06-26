import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { randomBytes } from 'crypto';
import Admin from 'storets-admin';
import Middleware from 'storets-middleware';
import Sql from 'storets-sql';
import S3 from 'storets-s3';

class Support {
	public static readonly textMask = {
		header: {
			title: (title: string) => {
				Admin.checkType(title, 'string', 'título');

				title = title.trim();

				Admin.checkLength(title, 1, 30, 'título');
			},
			description: (description: string) => {
				Admin.checkType(description, 'string', 'descrição');

				description = description.trim();

				Admin.checkLength(description, 1, 255, 'descrição');
			},
			color: (color: string) => {
				Admin.checkType(color, 'string', 'cor');

				color = color.trim();

				Admin.checkLength(color, 7, 7, 'cor');
			},
		},
		propagandas: {
			imagesContext: (imagesContext: Array<string>) => {
				Admin.checkType(imagesContext, 'object', 'imagesContext');
				Admin.checkLength(imagesContext, 2, 2, 'imagesContext');

				if (
					JSON.stringify(imagesContext.sort()) !==
					JSON.stringify(['bigImage', 'smallImage'])
				) {
					throw {
						status: 400,
						message:
							"Desculpe, dados necessários estão faltando. Por favor conserte o campo 'imagesContext' e tente novamente.",
					};
				}
			},
		},
		categories: {
			name: async (name: string) => {
				Admin.checkType(name, 'string', 'nome');

				name = name.trim();

				Admin.checkLength(name, 1, 30, 'nome');

				let query;

				[query] = await Sql.query(
					'SELECT `name` FROM `categories` WHERE `name` = ?;',
					[name],
				);

				if (Object(query).length !== 0) {
					throw {
						status: 400,
						message: `Desculpe, a categoria "${name}" já existe. Por favor, adicione um nome diferente e tente novamente.`,
					};
				}
			},
		},
		products: {
			category: async (category: string) => {
				Admin.checkType(category, 'string', 'categoria');

				category = category.trim();

				const [query] = await Sql.query(
					'SELECT `name` FROM `categories` WHERE `id` = ?;',
					[category],
				);

				if (Object(query).length === 0) {
					let message =
						'Desculpe, a categoria que você forneceu não existe. Por favor, escolha uma categoria existente e tente novamente.';

					const [query] = await Sql.query('SELECT `name` FROM `categories`;');

					if (Object(query).length === 0) {
						message =
							'Desculpe, não há categorias disponíveis no momento. Por favor, crie uma categoria primeiro e tente novamente.';
					}

					throw {
						status: 400,
						message,
					};
				}
			},
			name: (name: string) => {
				Admin.checkType(name, 'string', 'name');

				name = name.trim();

				Admin.checkLength(name, 1, 30, 'nome');
			},
			price: (price: string) => {
				Admin.checkType(price, 'string', 'preço');

				price = price.trim();

				Admin.checkLength(price, 1, -1, 'preço');
				Admin.checkNumber(price, 'preço');
				Admin.checkValue(price, 0, 3.402823466e38, 'preço');
			},
			off: (off: string) => {
				Admin.checkType(off, 'string', 'promoção');

				off = off.trim();

				Admin.checkLength(off, 1, -1, 'promoção');
				Admin.checkNumber(off, 'promoção');
				Admin.checkValue(off, 0, 100, 'promoção');
			},
			installment: (installment: string) => {
				Admin.checkType(installment, 'string', 'parcelas');

				installment = installment.trim();

				Admin.checkLength(installment, 0, 30, 'parcelas');
			},
			whatsapp: (whatsapp: string) => {
				Admin.checkType(whatsapp, 'string', 'whatsapp');

				whatsapp = whatsapp.trim();

				Admin.checkLength(whatsapp, 13, 13, 'whatsapp');
				Admin.checkNumber(whatsapp, 'whatsapp');
			},
			message: (message: string) => {
				Admin.checkType(message, 'string', 'mensagem');

				message = message.trim();

				Admin.checkLength(message, 0, 255, 'mensagem');
			},
		},
		footer: {
			title: (title: string) => {
				Admin.checkType(title, 'string', 'título');

				title = title.trim();

				Admin.checkLength(title, 1, 50, 'título');
			},
			text: (text: string) => {
				Admin.checkType(text, 'string', 'texto');

				text = text.trim();

				Admin.checkLength(text, 1, 255, 'texto');
			},
			whatsapp: (whatsapp: string) => {
				Admin.checkType(whatsapp, 'string', 'whatsapp');

				whatsapp = whatsapp.trim();

				Admin.checkLength(whatsapp, 13, 13, 'whatsapp');
				Admin.checkNumber(whatsapp, 'whatsapp');
			},
			facebook: (facebook: string) => {
				Admin.checkType(facebook, 'string', 'facebook');

				facebook = facebook.trim();

				Admin.checkLength(facebook, 2, 30, 'facebook');
				Admin.checkSubstring(facebook, '@', true, true, 'facebook');
				Admin.checkSubstring(facebook, ' ', false, false, 'facebook');
				Admin.checkSpecialCharacters(
					facebook.slice(1, facebook.length),
					'facebook',
				);
			},
			instagram: (instagram: string) => {
				Admin.checkType(instagram, 'string', 'instagram');

				instagram = instagram.trim();

				Admin.checkLength(instagram, 2, 30, 'instagram');
				Admin.checkSubstring(instagram, '@', true, true, 'instagram');
				Admin.checkSubstring(instagram, ' ', false, false, 'instagram');
				Admin.checkSpecialCharacters(
					instagram.slice(1, instagram.length),
					'instagram',
				);
			},
			location: (location: string) => {
				Admin.checkType(location, 'string', 'localização');

				location = location.trim();

				Admin.checkLength(location, 1, 64000, 'localização');
				Admin.checkSubstring(location, ' ', false, false, 'localização');
			},
			'store-info': (storeInfo: string) => {
				Admin.checkType(storeInfo, 'string', 'informação da loja');

				storeInfo = storeInfo.trim();

				Admin.checkLength(storeInfo, 1, 50, 'Informação');
			},
			'complete-store-info': (completeStoreInfo: string) => {
				Admin.checkType(completeStoreInfo, 'string', 'informação completa');

				completeStoreInfo = completeStoreInfo.trim();

				Admin.checkLength(completeStoreInfo, 5, 100, 'informação completa');
			},
		},
	};

	public static readonly imageMask = {
		header: {
			icon: async (file: Express.Multer.File | undefined) =>
				await this.sharpFile(file, 'inside', {
					width: 50,
					height: 50,
					trim: true,
				}),
			logo: async (file: Express.Multer.File | undefined) =>
				await this.sharpFile(file, 'contain', {
					height: 70,
					maxScale: 7.5,
					trim: true,
				}),
		},
		propagandas: {
			'big-image': async (file: Express.Multer.File | undefined) =>
				await this.sharpFile(file, 'cover', { width: 1920, height: 460 }),
			'small-image': async (file: Express.Multer.File | undefined) =>
				await this.sharpFile(file, 'cover', { width: 1080, height: 1080 }),
		},
		products: {
			image: async (file: Express.Multer.File | undefined) =>
				await this.sharpFile(file, 'inside', { width: 1080, height: 1080 }),
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
		options: {
			width?: number;
			height?: number;
			maxScale?: number;
			trim?: boolean;
		},
	) {
		const originalName = file!.originalname;

		file!.originalname = randomBytes(128).toString('hex').substring(0, 255);

		try {
			file!.buffer = options.trim
				? await sharp(file!.buffer)
						.trim()
						.resize({
							width: options.width,
							height: options.height,
							fit,
							background: { r: 255, g: 255, b: 255, alpha: 0 },
						})
						.toBuffer()
				: await sharp(file!.buffer)
						.resize({
							width: options.width,
							height: options.height,
							fit,
							background: { r: 255, g: 255, b: 255, alpha: 0 },
						})
						.toBuffer();

			if (options.maxScale) {
				const imageMetadata = await sharp(file!.buffer).metadata();
				const scale =
					Object(imageMetadata).width / Object(imageMetadata).height;

				if (scale > options.maxScale) {
					file!.buffer = await sharp(file!.buffer)
						.resize({
							width: options.maxScale * Object(imageMetadata).height,
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
				err.message === 'Input Buffer is empty' ||
				err.message ===
					'source: bad seek to 7448\nheif: Invalid input: Unspecified: Bitstream not supported by this decoder (2.0)'
			) {
				throw {
					status: 400,
					message: `Desculpe, a imagem "${originalName}" não é uma imagem válida. Por favor, tente escolher uma outra imagem.`,
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
		const [query] = await Sql.query('SELECT `id` FROM `propagandas`;');

		if (Object(query).length >= Number(process.env.MAX_PROPAGANDAS!)) {
			throw {
				status: 400,
				message:
					'Desculpe pelo inconveniente, parece que o número máximo de propagandas foi atingido.',
			};
		}

		this.textMask.propagandas.imagesContext(imagesContext);

		await this.imageMask.propagandas['big-image'](
			Object(files)[imagesContext.indexOf('bigImage')],
		);

		await this.imageMask.propagandas['small-image'](
			Object(files)[imagesContext.indexOf('smallImage')],
		);
	}

	/**
	 * Validates the data for the "postCategory" middleware.
	 * Checks if the number of categories has exceeded the maximum limit.
	 * Throws an error if the maximum limit is reached.
	 * Validates the name of the category using a text mask.
	 *
	 * @param name - The name of the category.
	 * @throws Error - Error object with status and message properties.
	 */
	public static async validateDataForMiddlewarePostCategory(name: string) {
		const [query] = await Sql.query('SELECT `id` FROM `categories`;');

		if (Object(query).length >= Number(process.env.MAX_CATEGORIES!)) {
			throw {
				status: 400,
				message:
					'Desculpe pelo inconveniente, parece que o número máximo de categorias foi atingido.',
			};
		}

		await this.textMask.categories.name(name);
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
		const [query] = await Sql.query('SELECT `id` FROM `products`;');

		if (Object(query).length >= Number(process.env.MAX_PRODUCTS!)) {
			throw {
				status: 400,
				message:
					'Desculpe pelo inconveniente, parece que o número máximo de produtos foi atingido.',
			};
		}

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
	public static async validateDataForMiddlewarePutText(
		id: string,
		data: string,
		table: string,
		column: string,
	) {
		Admin.checkType(id, 'string', 'id');
		Admin.checkLength(id.trim(), 1, -1, 'id');

		await Object(this.textMask)[table][column](data);
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
		Admin.checkLength(id.trim(), 1, -1, 'id');

		await Object(Support.imageMask)[table][column](file);
	}

	/**
	 * Validates data for a middleware used in a PUT position operation.
	 * @param ids - Array of strings representing the IDs to be validated.
	 * @param column - String representing the column name to be queried for existing IDs.
	 */
	public static async validateDataForMiddlewarePutPosition(
		ids: Array<string>,
		column: string,
	) {
		Admin.checkType(ids, 'object', 'ids');
		Admin.checkLength(ids, 1, -1, 'ids');

		const [query] = await Sql.query('SELECT `id` FROM `' + column + '`;');

		const queryIds: string[] = [];

		Object(query).forEach((item: object) => {
			queryIds.push(String(Object(item).id));
		});

		if (
			JSON.stringify(JSON.parse(JSON.stringify(ids)).sort()) !==
			JSON.stringify(queryIds.sort())
		) {
			throw {
				status: 400,
				message:
					'Desculpe, os ids enviados não são válidos ou estão incompletos. Por favor, verifique os dados e tente novamente.',
			};
		}
	}
}

export default class LocalModules {
	public static readonly multer = multer({ storage: multer.memoryStorage() });
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
	): (req: Request, res: Response, next: NextFunction) => void {
		return async function (req: Request, res: Response, next: NextFunction) {
			var upload;
			if (maxCount === 1) {
				upload = LocalModules.multer.single('file');
			} else {
				upload = LocalModules.multer.array('files', maxCount);
			}

			upload(req, res, (err: any) => {
				try {
					if (err instanceof multer.MulterError) {
						throw {
							status: 400,
							message:
								maxCount === 1
									? 'Desculpe, parece que a imagem enviada não é uma imagem válida. Por favor, verifique a imagem e tente novamente.'
									: 'Desculpe, parece que algumas imagens enviadas naõ são válidas. Por favor, verifique as imagens e tente novamente.',
						};
					}

					if (
						(maxCount === 1 && typeof req.file !== 'object') ||
						(maxCount > 1 && Object(req).files.length < minCount)
					) {
						throw {
							status: 400,
							message:
								maxCount === 1
									? 'Desculpe, parece que nenhuma imagem foi adicionada. Por favor, adicione uma imagem e tente novamente.'
									: 'Desculpe, parece que algumas imagens não foram adicionadas. Por favor, adicione todas as imagens e tente novamente.',
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
	 * @param {Request} req - The request object.
	 * @param {Response} res - The response object.
	 * @param {NextFunction} next - The next function to call in the middleware chain.
	 */
	public static async middlewarePostPropaganda(
		req: Request,
		res: Response,
		next: NextFunction,
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
				'INSERT INTO `propagandas` (`big-image`, `small-image`) VALUES (?, ?);',
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
	 * @param {Request} req - The request object.
	 * @param {Response} res - The response object.
	 * @param {NextFunction} next - The next function to call in the middleware chain.
	 */
	public static async middlewareDeletePropaganda(
		req: Request,
		res: Response,
		next: NextFunction,
	) {
		try {
			const id = req.body.id;

			Admin.checkType(id, 'string', 'id');
			Admin.checkLength(id.trim(), 1, -1, 'id');

			const [query] = await Sql.query(
				'SELECT `big-image`, `small-image` FROM `propagandas` WHERE `id` = ?;',
				[id],
			);

			if (Object(query).length === 0) {
				return next();
			}

			await S3.deleteFileFromS3Bucket(Object(query)[0]['big-image']);
			await S3.deleteFileFromS3Bucket(Object(query)[0]['small-image']);

			await Sql.query('DELETE FROM `propagandas` WHERE `id` = ?;', [id]);

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
	 * @param {Request} req - The request object.
	 * @param {Response} res - The response object.
	 * @param {NextFunction} next - The next function to call in the middleware chain.
	 */
	public static async middlewarePostCategory(
		req: Request,
		res: Response,
		next: NextFunction,
	) {
		try {
			const name = req.body.name;

			await Support.validateDataForMiddlewarePostCategory(name);

			await Sql.query('INSERT INTO `categories` (`name`) VALUES (?);', [
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
	 * @param {Request} req - The request object.
	 * @param {Response} res - The response object.
	 * @param {NextFunction} next - The next function to call in the middleware chain.
	 */
	public static async middlewareDeleteCategory(
		req: Request,
		res: Response,
		next: NextFunction,
	) {
		try {
			const id = req.body.id;

			Admin.checkType(id, 'string', 'id');
			Admin.checkLength(id.trim(), 1, -1, 'id');

			const [query] = await Sql.query(
				'SELECT `image` FROM `products` WHERE `category` = ?;',
				[id],
			);

			await Sql.query('DELETE FROM `products` WHERE `category` = ?;', [id]);

			for (let c = 0; c < Object(query).length; c++) {
				await S3.deleteFileFromS3Bucket(Object(query)[c].image);
			}

			await Sql.query('DELETE FROM `categories` WHERE `id` = ?;', [id]);

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
	 * @param {Request} req - The request object.
	 * @param {Response} res - The response object.
	 * @param {NextFunction} next - The next function to call in the middleware chain.
	 */
	public static async middlewarePostProduct(
		req: Request,
		res: Response,
		next: NextFunction,
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
				'INSERT INTO `products` (`category`, `name`, `image`, `price`, `off`, `installment`, `whatsapp`, `message`) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
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
	 * @param {Request} req - The request object.
	 * @param {Response} res - The response object.
	 * @param {NextFunction} next - The next function to call in the middleware chain.
	 */
	public static async middlewareDeleteProduct(
		req: Request,
		res: Response,
		next: NextFunction,
	) {
		try {
			const id = req.body.id;

			Admin.checkType(id, 'string', 'id');
			Admin.checkLength(id.trim(), 1, -1, 'id');

			const [query] = await Sql.query(
				'SELECT `id`, `image` FROM `products` WHERE `id` = ?;',
				[id],
			);

			if (Object(query).length === 0) {
				return next();
			}

			await S3.deleteFileFromS3Bucket(Object(query)[0].image);

			await Sql.query('DELETE FROM `products` WHERE `id` = ?;', [id]);

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
	 * @param {Request} req - The request object.
	 * @param {Response} res - The response object.
	 * @param {NextFunction} next - The next function to call in the middleware chain.
	 */
	public static async middlewarePutText(
		req: Request,
		res: Response,
		next: NextFunction,
	) {
		try {
			const url = req.originalUrl.split('/');
			const table = String(url[3]);
			const column = String(url[4]);
			const data = req.body[column];
			const id = req.body.id;

			await Support.validateDataForMiddlewarePutText(id, data, table, column);

			await Sql.query(
				'UPDATE `' + table + '` SET `' + column + '` = ? WHERE `id` = ?;',
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
	 * @param {Request} req - The request object.
	 * @param {Response} res - The response object.
	 * @param {NextFunction} next - The next function to call in the middleware chain.
	 */
	public static async middlewarePutImage(
		req: Request,
		res: Response,
		next: NextFunction,
	) {
		try {
			const url = req.originalUrl.split('/');
			const table = String(url[3]);
			const column = String(url[4]);
			const file = req.file;
			const id = req.body.id;

			await Support.validateDataForMiddlewarePutImage(id, file, table, column);

			const [query] = await Sql.query(
				'SELECT `' + column + '` FROM `' + table + '` WHERE `id` = ?;',
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

	/**
	 * Middleware function for handling a PUT position operation.
	 * @param req - Express request object.
	 * @param res - Express response object.
	 * @param next - Express next function.
	 */
	public static async middlewarePutPosition(
		req: Request,
		res: Response,
		next: NextFunction,
	) {
		try {
			const url = req.originalUrl.split('/');
			const column = String(url[3]);
			const ids = req.body.ids;

			await Support.validateDataForMiddlewarePutPosition(ids, column);

			for (let c = 0; c < ids.length; c++) {
				await Sql.query(
					'UPDATE `' + column + '` SET `position` = ? WHERE `id` = ?;',
					[c, ids[c]],
				);
			}

			return next();
		} catch (err) {
			Middleware.handleMiddlewareError(res, err);
		}
	}
}
