import express, { json } from 'express';
import fs from 'fs';
import path from 'path';
import { cwd } from 'process';
import mysql2 from 'mysql2/promise';
import dotenv from 'dotenv';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

dotenv.config({ path: path.resolve(cwd(), '.env') });

export class GlobalMySQLModules {
	private static readonly mysqlConn = mysql2.createPool({
		connectionLimit: 16,
		host: process.env.SQL_HOST!,
		user: process.env.SQL_USER!,
		password: process.env.SQL_PASSWORD!,
		database: process.env.SQL_DATABASE!,
		socketPath: process.env.SQL_SOCKET_PATH!,
	});

	public static async query(command: string, values: string[] = []) {
		return await GlobalMySQLModules.mysqlConn.query(command, values);
	}
}

export class GlobalS3Modules {
	private static readonly s3DataClient: S3Client = new S3Client({
		region: process.env.S3_BUCKET_REGION!,
		credentials: {
			accessKeyId: process.env.S3_ACCESS_ID!,
			secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
		},
	});

	public static async generateSignedUrlForS3BucketFile(fileName: string) {
		return await getSignedUrl(
			this.s3DataClient,
			new GetObjectCommand({
				Bucket: process.env.S3_BUCKET_NAME,
				Key: fileName,
			}),
			{ expiresIn: 30 * 60 },
		);
	}
}

export class GlobalMiddlewareModules {
	public static handleMiddlewareError(res: express.Response, err: any) {
		if (err.status) {
			res.status(err.status).json(err);
			return;
		}

		res.status(500).json({
			status: 500,
			message:
				'Please bear with us while we work to restore service. If you require additional assistance, please do not hesitate to contact our technical support team',
		});

		const errorLogFolderPath = path.join(cwd(), '.log');
		const errorLogFilePath = path.join(errorLogFolderPath, 'error.log');
		const errorMessage =
			'🔴\n' +
			new Date() +
			'\n' +
			String(!err.stack ? err : err.stack) +
			'\n\n\n';

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
