import express from 'express';
import fs from 'fs';
import path from 'path';
import { cwd } from 'process';
import mysql2 from 'mysql2/promise';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(cwd(), '.env') });

export class GlobalSqlModules {
	private static readonly sqlHost: string = String(process.env['SQL_HOST']);
	private static readonly sqlDatabase: string = String(process.env['SQL_DATABASE']);
	private static readonly sqlSocketPath: string = String(process.env['SQL_SOCKET_PATH']);

	public static readonly sqlSelectorConn = mysql2.createPool({
		connectionLimit: 16,
		host: this.sqlHost,
		database: this.sqlDatabase,
		socketPath: this.sqlSocketPath,
		user: String(process.env['SQL_SELECTOR_USER']),
		password: String(process.env['SQL_SELECTOR_PASSWORD']),
	});

	public static readonly sqlMasterConn = mysql2.createPool({
		connectionLimit: 16,
		host: this.sqlHost,
		database: this.sqlDatabase,
		socketPath: this.sqlSocketPath,
		user: String(process.env['SQL_MASTER_USER']),
		password: String(process.env['SQL_MASTER_PASSWORD']),
	});

	private static async query(conn: mysql2.Pool, command: string, values: string[] = []): Promise<[mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]]> {
		return await conn.query(command, values);
	}

	public static async sqlQuery(conn: mysql2.Pool, command: string, values: string[] = []): Promise<[mysql2.RowDataPacket[] | mysql2.RowDataPacket[][] | mysql2.OkPacket | mysql2.OkPacket[] | mysql2.ResultSetHeader, mysql2.FieldPacket[]]> {
		try {
			const query = await this.query(conn, command, values)

			return query
		} catch (err: any) {
			if (err.code === 'ER_BAD_NULL_ERROR' || err.code === 'ER_DATA_TOO_LONG' || err.code === 'ER_WARN_DATA_TRUNCATED') {
				throw {
					type: 400,
					message: 'Por favor, forneça todos os dados corretamente para concluir a solicitação',
				};
			}

			throw err;
		}
	}
}

export class GlobalS3Modules {
	private static readonly s3BucketName: string = process.env['S3_BUCKET_NAME']!;
	private static readonly s3BucketRegion: string = process.env['S3_BUCKET_REGION']!;
	private static readonly s3AccessId: string = process.env['S3_ACCESS_ID']!;
	private static readonly s3SecretAccessKey: string = process.env['S3_SECRET_ACCESS_KEY']!;
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
	public static handleMiddlewareError(res: express.Response, err: any): void {
		if (err.type && typeof err.type === 'number') {
			res.status(err.type).json({
				status: err.type,
				message: err.message,
			});

			return;
		}

		Object.keys(err).forEach((e) => {
			console.log(e, ': ', err[e]);
		});

		res.status(500).json({
			status: 500,
			message: 'Por favor, aguarde enquanto trabalhamos para restaurar o serviço. Caso precise de assistência adicional, não hesite em entrar em contato com a nossa equipe de suporte técnico.',
		});

		const errorLogFolderPath: string = path.join(cwd(), '.log');
		const errorLogFilePath: string = path.join(errorLogFolderPath, 'error.log');
		const errorMessage: string = '🔴\n' + new Date() + '\n' + String(!err.stack ? err : err.stack) + '\n\n\n';

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
