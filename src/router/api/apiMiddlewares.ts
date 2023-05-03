import express from "express";
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

	private static generateRandomFileName(tag: string): string {
		return (tag + "-" + crypto.randomBytes(128).toString("hex")).substring(0, 255);
	}

	private static async sharpImage(imageBuffer: Buffer, width: number, height: number, fit: keyof sharp.FitEnum): Promise<Buffer> {
		return await sharp(imageBuffer)
			.resize({ width, height, fit, background: { r: 0, g: 0, b: 0, alpha: 0 } })
			.toBuffer();
	}

	public static async validateDataForMiddlewarePostPropaganda(body: { imagesContext: [string, string] }, files: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined) {
		if (!files || files.length !== 2) {
			throw { type: 404, message: "Por favor, forneça todas as imagens corretamente para concluir a solicitação" };
		}

		try {
			const big: { fieldname: string; originalname: string; encoding: string; mimetype: string; buffer: Buffer; size: number } = Object(files)[body.imagesContext.indexOf("big")];
			big.originalname = this.generateRandomFileName("big");
			big.buffer = await this.sharpImage(big.buffer, 1920, 420, "contain");

			const small: { fieldname: string; originalname: string; encoding: string; mimetype: string; buffer: Buffer; size: number } = Object(files)[body.imagesContext.indexOf("small")];
			small.originalname = this.generateRandomFileName("small");
			small.buffer = await this.sharpImage(small.buffer, 800, 800, "contain");
		} catch (err: any) {
			if (err instanceof TypeError) {
				throw { type: 404, message: "Por favor, forneça imagens válidas para concluir a solicitação" };
			}

			if (err.message === "Input buffer contains unsupported image format") {
				throw { type: 404, message: "Por favor, forneça imagens válidas para concluir a solicitação" };
			} else {
				throw err;
			}
		}
	}

	public static async validateDataForMiddlewarePostCategory(body: { category: string }): Promise<void> {
		try {
			var [query]: [mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]] = await Sql.sqlMasterQuery("SELECT * FROM categories WHERE category = ?;", [body.category]);
		} catch (err: any) {
			if (err.code === "ER_DATA_TOO_LONG" || err.code === "ER_WARN_DATA_TRUNCATED" || err.message === "Bind parameters must not contain undefined. To pass SQL NULL specify JS null") {
				throw { type: 404, message: "Por favor, forneça todos os dados corretamente para concluir a solicitação" };
			}

			throw err;
		}

		if (Object(query).length !== 0) {
			throw { type: 404, message: "Por favor, forneça um nome de categoria diferente para concluir a solicitação" };
		}
	}

	public static async validateDataForMiddlewarePostProduct(files: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined) {
		if (!files || files.length !== 1) {
			throw { type: 404, message: "Por favor, forneça uma imagem válida para concluir a solicitação" };
		}

		try {
			const productImage: { fieldname: string; originalname: string; encoding: string; mimetype: string; buffer: Buffer; size: number } = Object(files)[0];
			productImage.originalname = this.generateRandomFileName("product");
			productImage.buffer = await this.sharpImage(productImage.buffer, 1920, 420, "contain");
		} catch (err: any) {
			if (err.message === "Input buffer contains unsupported image format") {
				throw { type: 404, message: "Por favor, forneça uma imagem válida para concluir a solicitação" };
			} else {
				throw err;
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

export default class ApiMiddlewares {
	public static middlewareUploadFiles(fieldName: string, maxCount: number) {
		return function (req: express.Request, res: express.Response, next: express.NextFunction) {
			const upload = MiddlewareUtil.multer.array(fieldName, maxCount);

			upload(req, res, (err: any) => {
				if (err instanceof multer.MulterError || !req.files) {
					return MiddlewareUtil.handleMiddlewareError(res, { type: 404, message: "Por favor, forneça o número adequado de imagens para concluir a solicitação" });
				} else if (err) {
					return MiddlewareUtil.handleMiddlewareError(res, err);
				}

				return next();
			});
		};
	}

	public static async middlewarePostPropaganda(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			await MiddlewareUtil.validateDataForMiddlewarePostPropaganda(req.body, req.files);

			const body: { imagesContext: [string, string] } = req.body;
			const files: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined = req.files;

			const big: { fieldname: string; originalname: string; encoding: string; mimetype: string; buffer: Buffer; size: number } = Object(files)[body.imagesContext.indexOf("big")];
			const small: { fieldname: string; originalname: string; encoding: string; mimetype: string; buffer: Buffer; size: number } = Object(files)[body.imagesContext.indexOf("small")];

			await S3.uploadFileToS3Bucket(big.buffer.toString(), big.originalname, big.mimetype);

			try {
				await S3.uploadFileToS3Bucket(small.buffer.toString(), small.originalname, small.mimetype);
			} catch (err) {
				await S3.deleteFileFromS3Bucket(big.originalname);

				throw err;
			}

			try {
				await Sql.sqlMasterQuery("INSERT INTO propagandas (big, small) VALUES (?, ?);", [big.originalname, small.originalname]);
			} catch (err) {
				await S3.deleteFileFromS3Bucket(big.originalname);
				await S3.deleteFileFromS3Bucket(small.originalname);

				throw err;
			}

			return next();
		} catch (err) {
			MiddlewareUtil.handleMiddlewareError(res, err);
		}
	}

	public static async middlewarePostCategory(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			await MiddlewareUtil.validateDataForMiddlewarePostCategory(req.body);

			const body: { category: string } = req.body;

			try {
				await Sql.sqlMasterQuery("INSERT INTO categories (category) VALUES (?);", [body.category]);
			} catch (err: any) {
				if (err.code === "ER_DATA_TOO_LONG" || err.code === "ER_WARN_DATA_TRUNCATED" || err.message === "Bind parameters must not contain undefined. To pass SQL NULL specify JS null") {
					throw { type: 404, message: "Por favor, forneça todos os dados corretamente para concluir a solicitação" };
				}

				throw err;
			}

			return next();
		} catch (err) {
			MiddlewareUtil.handleMiddlewareError(res, err);
		}
	}

	public static async middlewarePostProduct(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			await MiddlewareUtil.validateDataForMiddlewarePostProduct(req.files);

			const body: { category: string; name: string; price: string; off: string; installment: string; whatsapp: string; message: string } = req.body;
			const files: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined = req.files;

			await S3.uploadFileToS3Bucket(Object(files)[0].buffer.toString(), Object(files)[0].originalname, Object(files)[0].mimetype);

			try {
				await Sql.sqlMasterQuery("INSERT INTO products (category, name, image, price, off, installment, whatsapp, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [body.category, body.name, Object(files)[0].originalname, body.price, body.off, body.installment, body.whatsapp, body.message]);
			} catch (err: any) {
				await S3.deleteFileFromS3Bucket(Object(files)[0].originalname);

				if (err.code === "ER_DATA_TOO_LONG" || err.code === "ER_WARN_DATA_TRUNCATED" || err.message === "Bind parameters must not contain undefined. To pass SQL NULL specify JS null") {
					throw { type: 404, message: "Por favor, forneça todos os dados corretamente para concluir a solicitação" };
				}

				throw err;
			}

			return next();
		} catch (err) {
			MiddlewareUtil.handleMiddlewareError(res, err);
		}
	}

	public static middlewareSendStatusCode200(req: express.Request, res: express.Response) {
		res.json({
			status: 200,
			message: "ok",
		});
	}
}
