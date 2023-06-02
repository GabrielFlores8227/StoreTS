import express, { json } from 'express';
import fs from 'fs';
import path from 'path';
import { cwd } from 'process';
import mysql2 from 'mysql2/promise';
import dotenv from 'dotenv';
import {
	S3Client,
	GetObjectCommand,
	PutObjectCommand,
	DeleteObjectCommand,
} from '@aws-sdk/client-s3';
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

	public static async uploadFileToS3Bucket(
		fileBuffer: Buffer,
		fileName: string,
		mimeType: string,
	) {
		await this.s3DataClient.send(
			new PutObjectCommand({
				Bucket: process.env.S3_BUCKET_NAME,
				Body: fileBuffer,
				Key: fileName,
				ContentType: mimeType,
			}),
		);
	}

	public static async deleteFileFromS3Bucket(fileName: string) {
		await this.s3DataClient.send(
			new DeleteObjectCommand({
				Bucket: process.env.S3_BUCKET_NAME,
				Key: fileName,
			}),
		);
	}
}

export class GlobalMiddlewareModules {
	public static async middlewareBuildWebsite(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			const [query] = await GlobalMySQLModules.query(
				'SELECT history FROM website;',
			);

			if (!Object(req).builder) {
				Object(req).builder = {};
			}

			Object(req).builder.website = Object(query)[0];

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewareBuildHeader(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			const [query] = await GlobalMySQLModules.query(
				'SELECT icon, logo, title, description, color FROM header WHERE id = ?;',
				['only'],
			);

			Object(query)[0].icon =
				await GlobalS3Modules.generateSignedUrlForS3BucketFile(
					Object(query)[0].icon,
				);
			Object(query)[0].logo =
				await GlobalS3Modules.generateSignedUrlForS3BucketFile(
					Object(query)[0].logo,
				);

			if (!Object(req).builder) {
				Object(req).builder = {};
			}

			Object(req).builder.header = Object(query)[0];

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewareBuildPropagandas(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			const [query] = await GlobalMySQLModules.query(
				'SELECT bigImage, smallImage FROM propagandas ORDER BY position;',
			);

			for (let c = 0; c < Object(query).length; c++) {
				Object(query)[c].bigImage =
					await GlobalS3Modules.generateSignedUrlForS3BucketFile(
						Object(query)[c].bigImage,
					);
				Object(query)[c].smallImage =
					await GlobalS3Modules.generateSignedUrlForS3BucketFile(
						Object(query)[c].smallImage,
					);
			}

			if (!Object(req).builder) {
				Object(req).builder = {};
			}

			Object(req).builder.propagandas = query;

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	private static async buildProducts(req: express.Request, admin = false) {
		const [query1] = await GlobalMySQLModules.query(
			'SELECT id, name FROM categories ORDER BY position;',
		);

		const products = {};

		for (let c = 0; c < Object(query1).length; c++) {
			const [query2] = await GlobalMySQLModules.query(
				'SELECT ' +
					'id, name, image, price, off, installment' +
					(admin ? ', history' : '') +
					' FROM products WHERE category = ? ORDER BY position;',
				[Object(query1)[c].id],
			);

			for (let i = 0; i < Object(query2).length; i++) {
				Object(query2)[i].image =
					await GlobalS3Modules.generateSignedUrlForS3BucketFile(
						Object(query2)[i].image,
					);

				if (!Object(products)[Object(query1)[c].name]) {
					Object(products)[Object(query1)[c].name] = [];
				}

				Object(products)[Object(query1)[c].name].push(Object(query2)[i]);
			}
		}

		if (!Object(req).builder) {
			Object(req).builder = {};
		}

		Object(req).builder.products = products;
	}

	public static async middlewareBuildProductsForAdmin(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			await GlobalMiddlewareModules.buildProducts(req, true);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewareBuildProductsForClient(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			await GlobalMiddlewareModules.buildProducts(req);

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async middlewareBuildFooter(
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) {
		try {
			const [query] = await GlobalMySQLModules.query(
				'SELECT title, text, whatsapp, facebook, instagram, location, storeInfo, completeStoreInfo FROM footer WHERE id = ?;',
				['only'],
			);

			if (!Object(req).builder) {
				Object(req).builder = {};
			}

			Object(req).builder.footer = Object(query)[0];

			return next();
		} catch (err) {
			GlobalMiddlewareModules.handleMiddlewareError(res, err);
		}
	}

	public static async addHistory(table: 'website' | 'products', id: string) {
		const [query] = await GlobalMySQLModules.query(
			'SELECT history FROM ' + table + ' WHERE id = ?;',
			[id],
		);

		let history = Object(query)[0].history;

		if (!history) {
			history = [];
		}

		history.push(new Date());

		await GlobalMySQLModules.query(
			'UPDATE ' + table + ' SET history = ? WHERE id = ?;',
			[JSON.stringify(history), id],
		);
	}

	public static handleMiddlewareError(res: express.Response, err: any) {
		if (err.status) {
			if (err.redirect && err.url) {
				res
					.status(err.status)
					.redirect(err.url + '?message=' + err.message.replace(/ /g, '%20'));
				return;
			}

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
