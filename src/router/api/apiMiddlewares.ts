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
		const checker: { files: boolean[]; body: boolean[] } = {
			files: [!files || files.length !== 2 || JSON.stringify(Object.keys(Object(files)[0]).sort()) !== JSON.stringify(["fieldname", "originalname", "encoding", "mimetype", "buffer", "size"].sort()) || JSON.stringify(Object.keys(Object(files)[1]).sort()) !== JSON.stringify(["fieldname", "originalname", "encoding", "mimetype", "buffer", "size"].sort())],
			body: [!body || !body.imagesContext || !Array.isArray(body.imagesContext) || JSON.stringify(body.imagesContext.sort()) !== JSON.stringify(["big", "small"].sort())],
		};

		if (checker.files.includes(true)) {
			throw { type: 404, message: "Por favor, forneça todas as imagens corretamente para concluir a solicitação" };
		}

		if (checker.body.includes(true)) {
			throw { type: 404, message: "Por favor, forneça todos os dados corretamente para concluir a solicitação" };
		}

		try {
			const big: { fieldname: string; originalname: string; encoding: string; mimetype: string; buffer: Buffer; size: number } = Object(files)[body.imagesContext.indexOf("big")];
			big.originalname = this.generateRandomFileName("big");
			big.buffer = await this.sharpImage(big.buffer, 1920, 420, "contain");

			const small: { fieldname: string; originalname: string; encoding: string; mimetype: string; buffer: Buffer; size: number } = Object(files)[body.imagesContext.indexOf("small")];
			small.originalname = this.generateRandomFileName("small");
			small.buffer = await this.sharpImage(small.buffer, 800, 800, "contain");
		} catch (err: any) {
			if (err.message === "Input buffer contains unsupported image format") {
				throw { type: 404, message: "Por favor, forneça imagens válidas para concluir a solicitação" };
			} else {
				throw err;
			}
		}
	}

	public static async validateDataForMiddlewarePostCategory(body: { category: string }): Promise<void> {
		const checker: { body: boolean[] } = {
			body: [!body || typeof body.category !== "string" || body.category.length < 1 || body.category.length > 50],
		};

		if (checker.body.includes(true)) {
			throw { type: 404, message: "Por favor, forneça todos os dados corretamente para concluir a solicitação" };
		}

		const [query]: [mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]] = await Sql.sqlMasterQuery("SELECT * FROM categories WHERE category = ?;", [body.category]);

		if (Object(query).length !== 0) {
			throw { type: 404, message: "Por favor, forneça um nome de categoria diferente para concluir a solicitação" };
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
	public static middlewareSendStatusCode200(req: express.Request, res: express.Response) {
		res.json({
			status: 200,
			message: "ok",
		});
	}

	public static middlewareUploadFiles(fieldName: string, maxCount: number) {
		return function (req: express.Request, res: express.Response, next: express.NextFunction) {
			const upload = MiddlewareUtil.multer.array(fieldName, maxCount);

			upload(req, res, (err: any) => {
				if (err instanceof multer.MulterError || !req.files) {
					return MiddlewareUtil.handleMiddlewareError(res, { type: 404, message: "Por favor, forneça todas as imagens corretamente para concluir a solicitação" });
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

			await Sql.sqlMasterQuery("INSERT INTO categories (category) VALUES (?);", [body.category]);

			return next();
		} catch (err) {
			MiddlewareUtil.handleMiddlewareError(res, err);
		}
	}

	public static async middlewarePostProduct(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			return next();
		} catch (err) {
			MiddlewareUtil.handleMiddlewareError(res, err);
		}
	}
}
