import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { cwd } from 'process';
import mysql2 from 'mysql2/promise';
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(cwd(), '.env') });

/**
 * A class that provides global SQL modules.
 */
export class GlobalSqlModules {
	private static readonly sqlHost = process.env.SQL_HOST!;
	private static readonly sqlDatabase = process.env.SQL_DATABASE!;
	private static readonly sqlSocketPath = process.env.SQL_SOCKET_PATH!;

	// Connection pool for ordinary user
	public static readonly sqlOrdinaryConn = mysql2.createPool({
		connectionLimit: 16,
		host: this.sqlHost,
		database: this.sqlDatabase,
		socketPath: this.sqlSocketPath,
		user: process.env.SQL_ORDINARY_USER!,
		password: process.env.SQL_ORDINARY_PASSWORD!,
	});

	// Connection pool for master user
	public static readonly sqlMasterConn = mysql2.createPool({
		connectionLimit: 16,
		host: this.sqlHost,
		database: this.sqlDatabase,
		socketPath: this.sqlSocketPath,
		user: process.env.SQL_MASTER_USER!,
		password: process.env.SQL_MASTER_PASSWORD!,
	});

	/**
	 * Executes a SQL query using the provided connection pool.
	 * @param conn The MySQL connection pool.
	 * @param command The SQL command to execute.
	 * @param values Optional values to bind to the SQL command.
	 * @returns A promise that resolves to the query result.
	 */
	public static async sqlQuery(conn: mysql2.Pool, command: string, values: string[] = []) {
		return await conn.query(command, values);
	}
}

/**
 * A class that provides global S3 modules.
 */
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

	/**
	 * Generates a signed URL for accessing a file in the S3 bucket.
	 * @param fileName The name of the file in the S3 bucket.
	 * @returns A promise that resolves to the signed URL.
	 */
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

	/**
	 * Uploads a file to the S3 bucket.
	 * @param fileBuffer The file content as a string.
	 * @param fileName The name of the file in the S3 bucket.
	 * @param mimeType The MIME type of the file.
	 */
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

	/**
	 * Deletes a file from the S3 bucket.
	 * @param fileName The name of the file in the S3 bucket.
	 */
	public static async deleteFileFromS3Bucket(fileName: string): Promise<void> {
		await this.s3DataClient.send(
			new DeleteObjectCommand({
				Bucket: this.s3BucketName,
				Key: fileName,
			}),
		);
	}
}

/**
 * A class that provides global middleware modules.
 */
export class GlobalMiddlewareModules {
	public static readonly frontEndFolderPath = path.join(cwd(), 'src/front-end');

	public static readonly multer = multer({ storage: multer.memoryStorage() });

	/**
	 * Handles middleware errors and sends an appropriate response.
	 * @param res The Express response object.
	 * @param err The error object.
	 */
	public static handleMiddlewareError(res: express.Response, err: any) {
		if (err.status) {
			if (err.status === 308 && err.message) {
				return res.redirect(err.url + '?message=' + err.message);
			}

			return res.status(err.status).json(err);
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
