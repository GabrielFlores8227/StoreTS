import express from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { cwd } from 'process';
import mysql2 from 'mysql2/promise';
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(cwd(), '.env') });

export class GlobalSqlModules {
	private static readonly sqlHost = process.env.SQL_HOST!;
	private static readonly sqlDatabase = process.env.SQL_DATABASE!;
	private static readonly sqlSocketPath = process.env.SQL_SOCKET_PATH!;

	public static readonly sqlOrdinaryConn = mysql2.createPool({
		connectionLimit: 16,
		host: this.sqlHost,
		database: this.sqlDatabase,
		socketPath: this.sqlSocketPath,
		user: process.env.SQL_ORDINARY_USER!,
		password: process.env.SQL_ORDINARY_PASSWORD!,
	});

	public static readonly sqlMasterConn = mysql2.createPool({
		connectionLimit: 16,
		host: this.sqlHost,
		database: this.sqlDatabase,
		socketPath: this.sqlSocketPath,
		user: process.env.SQL_MASTER_USER!,
		password: process.env.SQL_MASTER_PASSWORD!,
	});

	public static async sqlQuery(conn: mysql2.Pool, command: string, values: string[] = []): Promise<[mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]]> {
		return await conn.query(command, values);
	}
}

export class GlobalS3Modules {
	private static readonly s3BucketName = process.env.S3_BUCKET_NAME!;
	private static readonly s3BucketRegion = process.env.S3_BUCKET_REGION!;
	private static readonly s3AccessId = process.env.S3_ACCESS_ID!;
	private static readonly s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY!;
	private static readonly s3DataClient: S3Client = new S3Client({
		region: this.s3BucketRegion,
		credentials: {
			accessKeyId: this.s3AccessId,
			secretAccessKey: this.s3SecretAccessKey,
		},
	});

	public static async generateSignedUrlForS3BucketFile(fileName: string) {
		return await getSignedUrl(
			this.s3DataClient,
			new GetObjectCommand({
				Bucket: this.s3BucketName,
				Key: fileName,
			}),
			{ expiresIn: 60 * 60 },
		);
	}

	public static async uploadFileToS3Bucket(fileBuffer: string, fileName: string, mimeType: string): Promise<void> {
		await this.s3DataClient.send(
			new PutObjectCommand({
				Bucket: this.s3BucketName,
				Body: fileBuffer,
				Key: fileName,
				ContentType: mimeType,
			}),
		);
	}

	public static async deleteFileFromS3Bucket(fileName: string): Promise<void> {
		await this.s3DataClient.send(
			new DeleteObjectCommand({
				Bucket: this.s3BucketName,
				Key: fileName,
			}),
		);
	}
}

export class GlobalMiddlewareModules {
	public static readonly frontEndFolderPath = path.join(cwd(), 'src/front-end');

	public static apiLimiter(minutes: number, max: number) {
		return rateLimit({
			windowMs: minutes * 60 * 1000,
			max: max,
			standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
			legacyHeaders: false, // Disable the `X-RateLimit-*` headers
		})
	}

	public static readonly multer = multer({ storage: multer.memoryStorage() });

	public static handleMiddlewareError(res: express.Response, err: any) {
		if (err.status) {
			res.status(err.status).json(err);

			return;
		}

		res.status(500).json({
			status: 500,
			message: 'Please bear with us while we work to restore service. If you require additional assistance, please do not hesitate to contact our technical support team',
		});

		const errorLogFolderPath = path.join(cwd(), '.log');
		const errorLogFilePath = path.join(errorLogFolderPath, 'error.log');
		const errorMessage = '🔴\n' + new Date() + '\n' + String(!err.stack ? err : err.stack) + '\n\n\n';

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
