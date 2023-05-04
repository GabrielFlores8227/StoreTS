import express, { query } from "express";
import mysql2 from "mysql2/promise";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import multer from "multer";
import fs from "fs";
import sharp from "sharp";
import crypto from "crypto";
import { cwd } from "process";
import dotenv from "dotenv";
import path from "path";
import { createHash } from "crypto";

dotenv.config({ path: path.resolve(cwd(), ".env") });

class Sql {
	private static readonly sqlHost: string = process.env["SQL_HOST"]!;
	private static readonly sqlDatabase: string = process.env["SQL_DATABASE"]!;
	private static readonly sqlSocketPath: string = process.env["SQL_SOCKET_PATH"]!;

	private static readonly sqlMasterUser: string = process.env["SQL_MASTER_USER"]!;
	private static readonly sqlMasterPassword: string = process.env["SQL_MASTER_PASSWORD"]!;
	private static readonly sqlMasterConn = mysql2.createConnection({
		host: this.sqlHost,
		database: this.sqlDatabase,
		socketPath: this.sqlSocketPath,
		user: this.sqlMasterUser,
		password: this.sqlMasterPassword,
	});

	public static async sqlMasterQuery(command: string, values: string[] = []): Promise<[mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]]> {
		return await (await this.sqlMasterConn).execute(command, values);
	}
}

class S3 {
	private static readonly s3BucketName: string = process.env["S3_BUCKET_NAME"]!;
	private static readonly s3BucketRegion: string = process.env["S3_BUCKET_REGION"]!;
	private static readonly s3AccessId: string = process.env["S3_ACCESS_ID"]!;
	private static readonly s3SecretAccessKey: string = process.env["S3_SECRET_ACCESS_KEY"]!;
	private static readonly s3DataClient: S3Client = new S3Client({
		region: this.s3BucketRegion,
		credentials: {
			accessKeyId: this.s3AccessId,
			secretAccessKey: this.s3SecretAccessKey,
		},
	});

	public static async uploadFileToS3Bucket(fileBuffer: string, fileName: string, mimeType: string): Promise<void> {
		await this.s3DataClient.send(
			new PutObjectCommand({
				Bucket: this.s3BucketName,
				Body: fileBuffer,
				Key: fileName,
				ContentType: mimeType,
			})
		);
	}

	public static async deleteFileFromS3Bucket(fileName: string): Promise<void> {
		await this.s3DataClient.send(
			new DeleteObjectCommand({
				Bucket: this.s3BucketName,
				Key: fileName,
			})
		);
	}
}

class MiddlewareUtil {
	public static readonly multer = multer({ storage: multer.memoryStorage() });

	private static generateRandomBytes(): string {
		return crypto.randomBytes(128).toString("hex").substring(0, 255);
	}

	private static async sharpImage(imageBuffer: Buffer, width: number, height: number, fit: keyof sharp.FitEnum): Promise<Buffer> {
		return await sharp(imageBuffer)
			.resize({ width, height, fit, background: { r: 0, g: 0, b: 0, alpha: 0 } })
			.toBuffer();
	}

	public static async deleteProduct(product: { id: number; image: string }): Promise<void> {
		await S3.deleteFileFromS3Bucket(product.image);

		await Sql.sqlMasterQuery("DELETE FROM products WHERE id = ?;", [String(product.id)]);
	}

	public static async validateDataForMiddlewarePostPropaganda(body: { imagesContext: [string, string] }, files: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined) {
		if (!files || files.length !== 2) {
			throw { type: 400, message: "Por favor, forneça todas as imagens corretamente para concluir a solicitação" };
		}

		try {
			const big: { fieldname: string; originalname: string; encoding: string; mimetype: string; buffer: Buffer; size: number } = Object(files)[body.imagesContext.indexOf("big")];
			big.originalname = this.generateRandomBytes();
			big.buffer = await this.sharpImage(big.buffer, 1920, 420, "contain");

			const small: { fieldname: string; originalname: string; encoding: string; mimetype: string; buffer: Buffer; size: number } = Object(files)[body.imagesContext.indexOf("small")];
			small.originalname = this.generateRandomBytes();
			small.buffer = await this.sharpImage(small.buffer, 800, 800, "contain");
		} catch (err: any) {
			if (err instanceof TypeError) {
				throw { type: 400, message: "Por favor, forneça todos os dados corretamente para concluir a solicitação" };
			}

			if (err.message === "Input buffer contains unsupported image format") {
				throw { type: 400, message: "Por favor, forneça imagens válidas para concluir a solicitação" };
			}

			throw err;
		}
	}

	public static async validateDataForMiddlewarePostCategory(body: { category: string }): Promise<void> {
		try {
			var [query]: [mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]] = await Sql.sqlMasterQuery("SELECT * FROM categories WHERE category = ?;", [body.category]);
		} catch (err: any) {
			if (err instanceof TypeError || err.code === "ER_DATA_TOO_LONG" || err.code === "ER_WARN_DATA_TRUNCATED" || err.message === "Bind parameters must not contain undefined. To pass SQL NULL specify JS null") {
				throw { type: 400, message: "Por favor, forneça todos os dados corretamente para concluir a solicitação" };
			}

			throw err;
		}

		if (Object(query).length !== 0) {
			throw { type: 400, message: "Por favor, forneça um nome de categoria diferente para concluir a solicitação" };
		}
	}

	public static async validateDataForMiddlewarePostProduct(body: { category: string; name: string; price: string; off: string; installment: string; whatsapp: string; message: string }, files: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined) {
		if (!files || files.length !== 1) {
			throw { type: 400, message: "Por favor, forneça uma imagem válida para concluir a solicitação" };
		}

		try {
			var [query]: [mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]] = await Sql.sqlMasterQuery("SELECT * FROM categories WHERE category = ?;", [body.category]);
		} catch (err: any) {
			if (err instanceof TypeError || err.code === "ER_DATA_TOO_LONG" || err.code === "ER_WARN_DATA_TRUNCATED" || err.message === "Bind parameters must not contain undefined. To pass SQL NULL specify JS null") {
				throw { type: 400, message: "Por favor, forneça todos os dados corretamente para concluir a solicitação" };
			}

			throw err;
		}

		if (Object(query).length !== 1) {
			throw { type: 400, message: "Por favor, forneça um nome de categoria existente para concluir a solicitação" };
		}

		try {
			const productImage: { fieldname: string; originalname: string; encoding: string; mimetype: string; buffer: Buffer; size: number } = Object(files)[0];
			productImage.originalname = this.generateRandomBytes();
			productImage.buffer = await this.sharpImage(productImage.buffer, 800, 800, "contain");
		} catch (err: any) {
			if (err instanceof TypeError) {
				throw { type: 400, message: "Por favor, forneça todos os dados corretamente para concluir a solicitação" };
			}

			if (err.message === "Input buffer contains unsupported image format") {
				throw { type: 400, message: "Por favor, forneça uma imagem válida para concluir a solicitação" };
			}

			throw err;
		}
	}

	public static async validateDataForMiddlewarePutLogin(body: { oldUser: string; oldPassword: string; newUser: string; newPassword: string }): Promise<void> {
		try {
			body.oldUser = createHash("sha512").update(body.oldUser).digest("hex");
			body.oldPassword = createHash("sha512").update(body.oldPassword).digest("hex");
			body.newUser = createHash("sha512").update(body.newUser).digest("hex");
			body.newPassword = createHash("sha512").update(body.newPassword).digest("hex");
			Object(body).newToken = this.generateRandomBytes();
		} catch (err) {
			if (err instanceof TypeError) {
				throw { type: 400, message: "Por favor, forneça todos os dados corretamente para concluir a solicitação" };
			}

			throw err;
		}

		const [query]: [mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]] = await Sql.sqlMasterQuery("SELECT user, password FROM auth WHERE user = ? AND password = ?;", [body.oldUser, body.oldPassword]);

		if (Object(query).length !== 1) {
			throw { type: 403, message: "Oops, algo não estava certo" };
		}
	}

	public static validateDataForMiddlewarePutText(body: { id: string; table: string; column: string; value: string }): void {
		const sqlMask: { header: string[]; categories: string[]; products: string[]; footer: string[] } = {
			header: ["title", "description"],
			categories: ["category"],
			products: ["category", "name", "price", "off", "installment", "whatsapp", "message"],
			footer: ["title", "text", "whatsapp", "facebook", "instagram"],
		};

		if (!Object(sqlMask)[body.table] || !Object(sqlMask)[body.table].includes(body.column)) {
			throw { type: 400, message: "Por favor, forneça todos os dados corretamente para concluir a solicitação" };
		}
	}

	public static async validateDataForMiddlewarePutImage(body: { id: string; table: string; column: string }, files: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined): Promise<void> {
		const sqlMask: { header: { icon: { width: number; height: number }; logo: { width: number; height: number } }; products: { image: { width: number; height: number } } } = {
			header: {
				icon: {
					width: 40,
					height: 40,
				},
				logo: {
					width: 36,
					height: 200,
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
			throw { type: 400, message: "Por favor, forneça todos os dados corretamente para concluir a solicitação" };
		}

		try {
			const image: { fieldname: string; originalname: string; encoding: string; mimetype: string; buffer: Buffer; size: number } = Object(files)[0];
			image.buffer = await this.sharpImage(image.buffer, Object(sqlMask)[body.table][body.column].width, Object(sqlMask)[body.table][body.column].height, "contain");
		} catch (err: any) {
			if (err instanceof TypeError) {
				throw { type: 400, message: "Por favor, forneça todos os dados corretamente para concluir a solicitação" };
			}

			if (err.message === "Input buffer contains unsupported image format") {
				throw { type: 400, message: "Por favor, forneça uma imagem válida para concluir a solicitação" };
			}

			throw err;
		}
	}

	public static async validateDataForMiddlewarePutPosition(body: { table: string; ids: string[] }) {
		const sqlMask: string[] = ["propagandas", "categories", "products"];

		if (!sqlMask.includes(body.table)) {
			throw { type: 400, message: "Por favor, forneça todos os dados corretamente para concluir a solicitação" };
		}

		const [query]: [mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]] = await Sql.sqlMasterQuery("SELECT id FROM " + body.table + " ORDER BY position;");

		if (Object(body.ids).length !== Object(query).length) {
			throw { type: 400, message: "Por favor, forneça todos os dados corretamente para concluir a solicitação" };
		}

		for (let c = 0; c < Object(query).length; c++) {
			const id: number = Object(query)[c].id;

			if (!body.ids.includes(String(id))) {
				throw { type: 400, message: "Por favor, forneça todos os dados corretamente para concluir a solicitação" };
			}
		}
	}

	public static handleMiddlewareError(res: express.Response, err: any): void {
		if (err.type && typeof err.type === "number") {
			res.status(err.type).json({
				status: err.type,
				message: err.message,
			});
		} else {
			res.status(500).json({
				status: 500,
				message: "Por favor, aguarde enquanto trabalhamos para restaurar o serviço. Caso precise de assistência adicional, não hesite em entrar em contato com a nossa equipe de suporte técnico.",
			});

			const errorLogFolderPath: string = path.join(cwd(), ".log");
			const errorLogFilePath: string = path.join(errorLogFolderPath, "error.log");
			const errorMessage: string = "🔴\n" + new Date() + "\n" + String(!err.stack ? err : err.stack) + "\n\n\n";

			if (!fs.existsSync(errorLogFilePath)) {
				if (!fs.existsSync(errorLogFolderPath)) {
					fs.mkdirSync(errorLogFolderPath, { recursive: true });
				}

				fs.writeFileSync(errorLogFilePath, errorMessage);

				return;
			}

			fs.appendFileSync(errorLogFilePath, errorMessage);
		}
	}
}

export default class AdminApiMiddlewares {
	public static async middlewareCheckToken(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			const body: { token: string } = req.body;

			try {
				var [query] = await Sql.sqlMasterQuery("SELECT token FROM auth WHERE id = ?", ["only"]);
			} catch (err: any) {
				if (err instanceof TypeError || err.code === "ER_DATA_TOO_LONG" || err.code === "ER_WARN_DATA_TRUNCATED" || err.message === "Bind parameters must not contain undefined. To pass SQL NULL specify JS null") {
					throw { type: 400, message: "Por favor, forneça todos os dados corretamente para concluir a solicitação" };
				}

				throw err;
			}

			console.log(Object(query)[0].token, body.token)
			if (Object(query)[0].token !== body.token) {
				throw { type: 403, message: "Oops, algo não estava certo" };
			}

			return next();
		} catch (err: any) {
			MiddlewareUtil.handleMiddlewareError(res, err);
		}
	}

	public static middlewareUploadFiles(fieldName: string, maxCount: number) {
		return function (req: express.Request, res: express.Response, next: express.NextFunction) {
			const upload = MiddlewareUtil.multer.array(fieldName, maxCount);

			upload(req, res, (err: any) => {
				if (err instanceof multer.MulterError || !req.files) {
					return MiddlewareUtil.handleMiddlewareError(res, { type: 400, message: "Por favor, forneça o número adequado de imagens para concluir a solicitação" });
				} else if (err) {
					return MiddlewareUtil.handleMiddlewareError(res, err);
				}

				return next();
			});
		};
	}

	public static async middlewarePostPropaganda(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			await MiddlewareUtil.validateDataForMiddlewarePostPropaganda(req.body, req.files);

			const body: { imagesContext: [string, string] } = req.body;
			const files: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined = req.files;

			const big: { fieldname: string; originalname: string; encoding: string; mimetype: string; buffer: Buffer; size: number } = Object(files)[body.imagesContext.indexOf("big")];
			const small: { fieldname: string; originalname: string; encoding: string; mimetype: string; buffer: Buffer; size: number } = Object(files)[body.imagesContext.indexOf("small")];

			await S3.uploadFileToS3Bucket(big.buffer.toString(), big.originalname, big.mimetype);

			try {
				await S3.uploadFileToS3Bucket(small.buffer.toString(), small.originalname, small.mimetype);
			} catch (err: any) {
				await S3.deleteFileFromS3Bucket(big.originalname);

				throw err;
			}

			try {
				await Sql.sqlMasterQuery("INSERT INTO propagandas (big, small) VALUES (?, ?);", [big.originalname, small.originalname]);
			} catch (err: any) {
				await S3.deleteFileFromS3Bucket(big.originalname);
				await S3.deleteFileFromS3Bucket(small.originalname);

				throw err;
			}

			return next();
		} catch (err: any) {
			MiddlewareUtil.handleMiddlewareError(res, err);
		}
	}

	public static async middlewarePostCategory(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			await MiddlewareUtil.validateDataForMiddlewarePostCategory(req.body);

			const body: { category: string } = req.body;

			try {
				await Sql.sqlMasterQuery("INSERT INTO categories (category) VALUES (?);", [body.category]);
			} catch (err: any) {
				if (err instanceof TypeError || err.code === "ER_DATA_TOO_LONG" || err.code === "ER_WARN_DATA_TRUNCATED" || err.message === "Bind parameters must not contain undefined. To pass SQL NULL specify JS null") {
					throw { type: 400, message: "Por favor, forneça todos os dados corretamente para concluir a solicitação" };
				}

				throw err;
			}

			return next();
		} catch (err: any) {
			MiddlewareUtil.handleMiddlewareError(res, err);
		}
	}

	public static async middlewarePostProduct(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			await MiddlewareUtil.validateDataForMiddlewarePostProduct(req.body, req.files);

			const body: { category: string; name: string; price: string; off: string; installment: string; whatsapp: string; message: string } = req.body;
			const files: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined = req.files;

			await S3.uploadFileToS3Bucket(Object(files)[0].buffer.toString(), Object(files)[0].originalname, Object(files)[0].mimetype);

			try {
				await Sql.sqlMasterQuery("INSERT INTO products (category, name, image, price, off, installment, whatsapp, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?);", [body.category, body.name, Object(files)[0].originalname, body.price, body.off, body.installment, body.whatsapp, body.message]);
			} catch (err: any) {
				await S3.deleteFileFromS3Bucket(Object(files)[0].originalname);

				if (err instanceof TypeError || err.code === "ER_DATA_TOO_LONG" || err.code === "ER_WARN_DATA_TRUNCATED" || err.message === "Bind parameters must not contain undefined. To pass SQL NULL specify JS null") {
					throw { type: 400, message: "Por favor, forneça todos os dados corretamente para concluir a solicitação" };
				}

				throw err;
			}

			return next();
		} catch (err: any) {
			MiddlewareUtil.handleMiddlewareError(res, err);
		}
	}

	public static async middlewarePutLogin(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			await MiddlewareUtil.validateDataForMiddlewarePutLogin(req.body);

			const body: { oldUser: string; oldPassword: string; newUser: string; newPassword: string; newToken: string } = req.body;

			await Sql.sqlMasterQuery("UPDATE auth SET user = ?, password = ?, token = ? WHERE id = ?", [body.newUser, body.newPassword, body.newToken, "only"]);

			return next();
		} catch (err: any) {
			MiddlewareUtil.handleMiddlewareError(res, err);
		}
	}

	public static async middlewarePutText(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			MiddlewareUtil.validateDataForMiddlewarePutText(req.body);

			const body: { id: string; table: string; column: string; value: string } = req.body;

			try {
				await Sql.sqlMasterQuery("UPDATE " + body.table + " SET " + body.column + " = ? WHERE id = ?;", [body.value, body.id]);
			} catch (err: any) {
				if (err instanceof TypeError || err.code === "ER_DATA_TOO_LONG" || err.code === "ER_WARN_DATA_TRUNCATED" || err.message === "Bind parameters must not contain undefined. To pass SQL NULL specify JS null") {
					throw { type: 400, message: "Por favor, forneça todos os dados corretamente para concluir a solicitação" };
				}

				throw err;
			}

			return next();
		} catch (err: any) {
			MiddlewareUtil.handleMiddlewareError(res, err);
		}
	}

	public static async middlewarePutImage(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			await MiddlewareUtil.validateDataForMiddlewarePutImage(req.body, req.files);

			const body: { id: string; table: string; column: string; value: string } = req.body;
			const files: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined = req.files;

			try {
				var [query] = await Sql.sqlMasterQuery("SELECT " + body.column + " FROM " + body.table + " WHERE id = ?;", [body.id]);
			} catch (err: any) {
				if (err instanceof TypeError || err.code === "ER_DATA_TOO_LONG" || err.code === "ER_WARN_DATA_TRUNCATED" || err.message === "Bind parameters must not contain undefined. To pass SQL NULL specify JS null") {
					throw { type: 400, message: "Por favor, forneça todos os dados corretamente para concluir a solicitação" };
				}

				throw err;
			}

			if (Object(query).length === 0) {
				return next();
			}

			await S3.uploadFileToS3Bucket(Object(files)[0].buffer, Object(query)[0][body.column], Object(files)[0].mimetype);

			return next();
		} catch (err: any) {
			MiddlewareUtil.handleMiddlewareError(res, err);
		}
	}

	public static async middlewarePutPosition(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			await MiddlewareUtil.validateDataForMiddlewarePutPosition(req.body);

			const body: { table: string; ids: string[] } = req.body;

			for (let c = 0; c < body.ids.length; c++) {
				await Sql.sqlMasterQuery("UPDATE " + body.table + " SET position = ? WHERE id = ?;", [String(c), Object(body).ids[c]]);
			}

			return next();
		} catch (err: any) {
			MiddlewareUtil.handleMiddlewareError(res, err);
		}
	}

	public static async middlewareDeletePropaganda(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			const body: { id: string } = req.body;

			try {
				var [query]: [mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]] = await Sql.sqlMasterQuery("SELECT big, small FROM propagandas WHERE id = ?;", [body.id]);
			} catch (err: any) {
				if (err instanceof TypeError || err.code === "ER_DATA_TOO_LONG" || err.code === "ER_WARN_DATA_TRUNCATED" || err.message === "Bind parameters must not contain undefined. To pass SQL NULL specify JS null") {
					throw { type: 400, message: "Por favor, forneça todos os dados corretamente para concluir a solicitação" };
				}

				throw err;
			}

			if (Object(query).length === 0) {
				return next();
			}

			try {
				await S3.deleteFileFromS3Bucket(Object(query)[0].big);
				await S3.deleteFileFromS3Bucket(Object(query)[0].small);
			} catch (err: any) {
				await Sql.sqlMasterQuery("DELETE FROM propagandas WHERE id = ?;", [body.id]);

				throw err;
			}

			await Sql.sqlMasterQuery("DELETE FROM propagandas WHERE id = ?;", [body.id]);

			return next();
		} catch (err: any) {
			MiddlewareUtil.handleMiddlewareError(res, err);
		}
	}

	public static async middlewareDeleteCategory(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			const body: { id: string } = req.body;

			try {
				var [query1]: [mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]] = await Sql.sqlMasterQuery("SELECT category FROM categories WHERE id = ?;", [body.id]);
			} catch (err: any) {
				if (err instanceof TypeError || err.code === "ER_DATA_TOO_LONG" || err.code === "ER_WARN_DATA_TRUNCATED" || err.message === "Bind parameters must not contain undefined. To pass SQL NULL specify JS null") {
					throw { type: 400, message: "Por favor, forneça todos os dados corretamente para concluir a solicitação" };
				}

				throw err;
			}

			if (Object(query1).length !== 1) {
				return next();
			}

			const [query2]: [mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]] = await Sql.sqlMasterQuery("SELECT id, image FROM products WHERE category = ?;", [Object(query1)[0].category]);

			for (let c = 0; c < Object(query2).length; c++) {
				await MiddlewareUtil.deleteProduct(Object(query2)[c]);
			}

			await Sql.sqlMasterQuery("DELETE FROM categories WHERE id = ?;", [body.id]);

			return next();
		} catch (err: any) {
			MiddlewareUtil.handleMiddlewareError(res, err);
		}
	}

	public static async middlewareDeleteProduct(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
		try {
			const body: { id: string } = req.body;

			try {
				var [query]: [mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]] = await Sql.sqlMasterQuery("SELECT id, image FROM products WHERE id = ?;", [body.id]);
			} catch (err: any) {
				if (err instanceof TypeError || err.code === "ER_DATA_TOO_LONG" || err.code === "ER_WARN_DATA_TRUNCATED" || err.message === "Bind parameters must not contain undefined. To pass SQL NULL specify JS null") {
					throw { type: 400, message: "Por favor, forneça todos os dados corretamente para concluir a solicitação" };
				}

				throw err;
			}

			if (Object(query).length !== 1) {
				return next();
			}

			MiddlewareUtil.deleteProduct(Object(query)[0]);

			return next();
		} catch (err: any) {
			MiddlewareUtil.handleMiddlewareError(res, err);
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
