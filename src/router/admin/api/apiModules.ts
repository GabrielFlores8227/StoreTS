import express from 'express';
import { GlobalSqlModules, GlobalS3Modules, GlobalMiddlewareModules } from '../../globalModules';
import mysql2 from 'mysql2/promise';
import multer from 'multer';
import sharp from 'sharp';
import crypto from 'crypto';
import { createHash } from 'crypto';

class LocalMiddlewareModules {
	public static readonly multer = multer({ storage: multer.memoryStorage() });

	private static generateRandomBytes(): string {
		return crypto.randomBytes(128).toString('hex').substring(0, 255);
	}

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

	public static async deleteProduct(product: { id: number; image: string }): Promise<void> {
		await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'DELETE FROM products WHERE id = ?;', [String(product.id)]);

		await GlobalS3Modules.deleteFileFromS3Bucket(product.image);
	}

	public static async validateDataForMiddlewarePostPropaganda(body: { imagesContext: [string, string] }, files: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined): Promise<void> {
		if (!files || files.length !== 2) {
			throw {
				type: 400,
				message: 'Por favor, forneça todas as imagens corretamente para concluir a solicitação',
			};
		}

		try {
			const big: { [key: string]: string } = Object(files)[body.imagesContext.indexOf('big')];

			Object(big).originalname = this.generateRandomBytes();
			Object(big).big = await this.sharpImage(Object(big).buffer, 1920, 420, 'contain');

			const small: {
				[key: string]: string;
			} = Object(files)[body.imagesContext.indexOf('small')];

			Object(small).originalname = this.generateRandomBytes();
			Object(small).buffer = await this.sharpImage(Object(small).buffer, 800, 800, 'contain');
		} catch (err: any) {
			if (err instanceof TypeError) {
				throw {
					type: 400,
					message: 'Por favor, forneça todos os dados corretamente para concluir a solicitação',
				};
			}

			if (err.message === 'Input buffer contains unsupported image format') {
				throw {
					type: 400,
					message: 'Por favor, forneça imagens válidas para concluir a solicitação',
				};
			}

			throw err;
		}
	}

	public static async validateDataForMiddlewarePostCategory(body: { category: string }): Promise<void> {
		const [query]: [mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT * FROM categories WHERE category = ?;', [body.category])

		if (Object(query).length !== 0) {
			throw {
				type: 400,
				message: 'Por favor, forneça um nome de categoria diferente para concluir a solicitação',
			};
		}
	}

	public static async validateDataForMiddlewarePostProduct(
		body: {
			category: string;
			name: string;
			price: string;
			off: string;
			installment: string;
			whatsapp: string;
			message: string;
		},
		files: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined,
	): Promise<void> {
		if (!files || files.length !== 1) {
			throw {
				type: 400,
				message: 'Por favor, forneça uma imagem válida para concluir a solicitação',
			};
		}

		const [query]: [mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT * FROM categories WHERE category = ?;', [body.category]);

		if (Object(query).length !== 1) {
			throw {
				type: 400,
				message: 'Por favor, forneça todos os dados corretamente para concluir a solicitação',
			};
		}

		try {
			const productImage: {
				fieldname: string;
				originalname: string;
				encoding: string;
				mimetype: string;
				buffer: Buffer;
				size: number;
			} = Object(files)[0];
			productImage.originalname = this.generateRandomBytes();
			productImage.buffer = await this.sharpImage(productImage.buffer, 800, 800, 'contain');
		} catch (err: any) {
			if (err instanceof TypeError) {
				throw {
					type: 400,
					message: 'Por favor, forneça todos os dados corretamente para concluir a solicitação',
				};
			}

			if (err.message === 'Input buffer contains unsupported image format') {
				throw {
					type: 400,
					message: 'Por favor, forneça uma imagem válida para concluir a solicitação',
				};
			}

			throw err;
		}
	}

	public static async validateDataForMiddlewarePutLogin(body: { oldUser: string; oldPassword: string; newUser: string; newPassword: string }): Promise<void> {
		try {
			body.oldUser = createHash('sha512').update(body.oldUser).digest('hex');
			body.oldPassword = createHash('sha512').update(body.oldPassword).digest('hex');
			body.newUser = createHash('sha512').update(body.newUser).digest('hex');
			body.newPassword = createHash('sha512').update(body.newPassword).digest('hex');
			Object(body).newToken = this.generateRandomBytes();
		} catch (err: any) {
			if (err instanceof TypeError) {
				throw {
					type: 400,
					message: 'Por favor, forneça todos os dados corretamente para concluir a solicitação',
				};
			}

			throw err;
		}

		const [query]: [mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT user, password FROM auth WHERE user = ? AND password = ?;', [body.oldUser, body.oldPassword]);

		if (Object(query).length !== 1) {
			throw { type: 403, message: 'Oops, algo não estava certo' };
		}
	}

	public static validateDataForMiddlewarePutText(body: { id: string; table: string; column: string; value: string }): void {
		const sqlMask: {
			header: string[];
			categories: string[];
			products: string[];
			footer: string[];
		} = {
			header: ['title', 'description'],
			categories: ['category'],
			products: ['category', 'name', 'price', 'off', 'installment', 'whatsapp', 'message'],
			footer: ['title', 'text', 'whatsapp', 'facebook', 'instagram'],
		};

		if (!Object(sqlMask)[body.table] || !Object(sqlMask)[body.table].includes(body.column)) {
			throw {
				type: 400,
				message: 'Por favor, forneça todos os dados corretamente para concluir a solicitação',
			};
		}
	}

	public static async validateDataForMiddlewarePutImage(body: { id: string; table: string; column: string }, files: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined): Promise<void> {
		const sqlMask: {
			header: {
				icon: { width: number; height: number };
				logo: { width: number; height: number };
			};
			products: { image: { width: number; height: number } };
		} = {
			header: {
				icon: {
					width: 40,
					height: 40,
				},
				logo: {
					width: 200,
					height: 36,
				},
			},
			products: {
				image: {
					width: 800,
					height: 800,
				},
			},
		};

		if (!Object(sqlMask)[body.table] || !Object(sqlMask)[body.table][body.column]) {
			throw {
				type: 400,
				message: 'Por favor, forneça todos os dados corretamente para concluir a solicitação',
			};
		}

		try {
			const image: {
				[key: string]: string;
			} = Object(files)[0];
			Object(image).buffer = await this.sharpImage(Object(image).buffer, Object(sqlMask)[body.table][body.column].width, Object(sqlMask)[body.table][body.column].height, 'contain');
		} catch (err: any) {
			if (err instanceof TypeError) {
				throw {
					type: 400,
					message: 'Por favor, forneça todos os dados corretamente para concluir a solicitação',
				};
			}

			if (err.message === 'Input buffer contains unsupported image format') {
				throw {
					type: 400,
					message: 'Por favor, forneça uma imagem válida para concluir a solicitação',
				};
			}

			throw err;
		}
	}

	public static async validateDataForMiddlewarePutPosition(body: { table: string; ids: string[] }): Promise<void> {
		const sqlMask: string[] = ['propagandas', 'categories', 'products'];

		if (!sqlMask.includes(body.table)) {
			throw {
				type: 400,
				message: 'Por favor, forneça todos os dados corretamente para concluir a solicitação',
			};
		}

		const [query] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT id FROM ' + body.table + ' ORDER BY position;');

		if (Object(body.ids).length !== Object(query).length) {
			throw {
				type: 400,
				message: 'Por favor, forneça todos os dados corretamente para concluir a solicitação',
			};
		}

		for (let c = 0; c < Object(query).length; c++) {
			if (!body.ids.includes(String(Object(query)[c].id))) {
				throw {
					type: 400,
					message: 'Por favor, forneça todos os dados corretamente para concluir a solicitação',
				};
			}
		}
	}
}

export default class ApiModules {
	public static async middlewareCheckToken(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			const body: { token: string } = req.body;

			const [query]: [mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]] | undefined = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT token FROM auth WHERE id = ?', ['only']);
			

			if (Object(query)[0].token !== body.token) {
				throw { type: 403, message: 'Oops, algo não estava certo' };
			}

			return next();
		} catch (err: any) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static middlewareUploadFiles(fieldName: string, maxCount: number) {
		return function (req: express.Request, res: express.Response, next: express.NextFunction) {
			const upload = LocalMiddlewareModules.multer.array(fieldName, maxCount);

			upload(req, res, (err: any) => {
				if (err instanceof multer.MulterError || !req.files) {
					return GlobalMiddlewareModules.handleMiddlewareError(res, {
						type: 400,
						message: 'Por favor, forneça o número adequado de imagens para concluir a solicitação',
					});
				} else if (err) {
					return GlobalMiddlewareModules.handleMiddlewareError(res, err);
				}

				return next();
			});
		};
	}

	public static async middlewarePostPropaganda(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			await LocalMiddlewareModules.validateDataForMiddlewarePostPropaganda(req.body, req.files);

			const body: { imagesContext: [string, string] } = req.body;
			const files: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined = req.files;

			const big: {
				fieldname: string;
				originalname: string;
				encoding: string;
				mimetype: string;
				buffer: Buffer;
				size: number;
			} = Object(files)[body.imagesContext.indexOf('big')];
			const small: {
				fieldname: string;
				originalname: string;
				encoding: string;
				mimetype: string;
				buffer: Buffer;
				size: number;
			} = Object(files)[body.imagesContext.indexOf('small')];

			await GlobalS3Modules.uploadFileToS3Bucket(big.buffer.toString(), big.originalname, big.mimetype);

			try {
				await GlobalS3Modules.uploadFileToS3Bucket(small.buffer.toString(), small.originalname, small.mimetype);
			} catch (err: any) {
				await GlobalS3Modules.deleteFileFromS3Bucket(big.originalname);

				throw err;
			}

			try {
				await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'INSERT INTO propagandas (big, small) VALUES (?, ?);', [big.originalname, small.originalname]);
			} catch (err: any) {
				await GlobalS3Modules.deleteFileFromS3Bucket(big.originalname);
				await GlobalS3Modules.deleteFileFromS3Bucket(small.originalname);

				throw err;
			}

			return next();
		} catch (err: any) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewarePostCategory(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			await LocalMiddlewareModules.validateDataForMiddlewarePostCategory(req.body);

			const body: { category: string } = req.body;

			try {
				await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'INSERT INTO categories (category) VALUES (?);', [body.category]);
			} catch (err: any) {
				if (err.code === 'ER_BAD_NULL_ERROR' || err.code === 'ER_DATA_TOO_LONG' || err.code === 'ER_WARN_DATA_TRUNCATED') {
					throw {
						type: 400,
						message: 'Por favor, forneça todos os dados corretamente para concluir a solicitação',
					};
				}

				throw err;
			}

			return next();
		} catch (err: any) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewarePostProduct(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			await LocalMiddlewareModules.validateDataForMiddlewarePostProduct(req.body, req.files);

			const body: {
				category: string;
				name: string;
				price: string;
				off: string;
				installment: string;
				whatsapp: string;
				message: string;
			} = req.body;
			const files: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined = req.files;


			await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'INSERT INTO products (category, name, image, price, off, installment, whatsapp, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?);', [body.category, body.name, Object(files)[0].originalname, body.price, body.off, body.installment, body.whatsapp, body.message]);

			await GlobalS3Modules.uploadFileToS3Bucket(Object(files)[0].buffer.toString(), Object(files)[0].originalname, Object(files)[0].mimetype);

			return next();
		} catch (err: any) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewarePutLogin(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			await LocalMiddlewareModules.validateDataForMiddlewarePutLogin(req.body);

			const body: {
				oldUser: string;
				oldPassword: string;
				newUser: string;
				newPassword: string;
				newToken: string;
			} = req.body;

			await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'UPDATE auth SET user = ?, password = ?, token = ? WHERE id = ?', [body.newUser, body.newPassword, body.newToken, 'only']);

			return next();
		} catch (err: any) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewarePutText(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			LocalMiddlewareModules.validateDataForMiddlewarePutText(req.body);

			const body: { id: string; table: string; column: string; value: string } = req.body;

			try {
				await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'UPDATE ' + body.table + ' SET ' + body.column + ' = ? WHERE id = ?;', [body.value, body.id]);
			} catch (err: any) {
				if (err.code === 'ER_BAD_NULL_ERROR' || err.code === 'ER_DATA_TOO_LONG' || err.code === 'ER_WARN_DATA_TRUNCATED') {
					throw {
						type: 400,
						message: 'Por favor, forneça todos os dados corretamente para concluir a solicitação',
					};
				}
			}

			return next();
		} catch (err: any) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewarePutImage(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			await LocalMiddlewareModules.validateDataForMiddlewarePutImage(req.body, req.files);

			const body: { id: string; table: string; column: string; value: string } = req.body;
			const files: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined = req.files;

			const [query]: any = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT ' + body.column + ' FROM ' + body.table + ' WHERE id = ?;', [body.id]);

			if (Object(query).length !== 1) {
				return next();
			}

			await GlobalS3Modules.uploadFileToS3Bucket(Object(files)[0].buffer, Object(query)[0][body.column], Object(files)[0].mimetype);

			return next();
		} catch (err: any) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewarePutPosition(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			await LocalMiddlewareModules.validateDataForMiddlewarePutPosition(req.body);

			const body: { table: string; ids: string[] } = req.body;

			for (let c = 0; c < body.ids.length; c++) {
				await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'UPDATE ' + body.table + ' SET position = ? WHERE id = ?;', [String(c), Object(body).ids[c]]);
			}

			return next();
		} catch (err: any) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewareDeletePropaganda(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			const body: { id: string } = req.body;

			const [query]: [mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT big, small FROM propagandas WHERE id = ?;', [body.id]);

			if (Object(query).length !== 1) {
				return next();
			}

			await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'DELETE FROM propagandas WHERE id = ?;', [body.id]);

			await GlobalS3Modules.deleteFileFromS3Bucket(Object(query)[0].big);
			await GlobalS3Modules.deleteFileFromS3Bucket(Object(query)[0].small);

			return next();
		} catch (err: any) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewareDeleteCategory(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			const body: { id: string } = req.body;

			const [query1]: [mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT category FROM categories WHERE id = ?;', [body.id]);

			if (Object(query1).length !== 1) {
				return next();
			}

			const [query2]: [mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT id, image FROM products WHERE category = ?;', [Object(query1)[0].category]);

			for (let c = 0; c < Object(query2).length; c++) {
				await LocalMiddlewareModules.deleteProduct(Object(query2)[c]);
			}

			await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'DELETE FROM categories WHERE id = ?;', [body.id]);

			return next();
		} catch (err: any) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewareDeleteProduct(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			const body: { id: string } = req.body;

			const [query]: [mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]] = await GlobalSqlModules.sqlQuery(GlobalSqlModules.sqlMasterConn, 'SELECT id, image FROM products WHERE id = ?;', [body.id]);

			if (Object(query).length !== 1) {
				return next();
			}

			LocalMiddlewareModules.deleteProduct(Object(query)[0]);

			return next();
		} catch (err: any) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static middlewareSendResponse(status: number) {
		return function (req: express.Request, res: express.Response) {
			res.json({
				status: status,
			});
		};
	}
}
