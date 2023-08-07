import express from 'express';
import { rateLimit } from 'express-rate-limit';
import Middleware from 'storets-middleware';
import Sql from 'storets-sql';
import session from 'express-session';
import router from './router/router';

//
// App
//

const app = express();

//
// Set
//

// Enable trust for the reverse proxy
// 1 = Number of reverse proxies between client and server
app.set('trust proxy', 1);

// Enable view engine (ejs)
app.set('view engine', 'ejs');

//
// Use
//

// Enable request rate limiting
app.use(
	rateLimit({
		windowMs: 24 * 60 * 60 * 1000,
		max: 10000,
		handler: async (_: express.Request, res: express.Response) => {
			res.status(429).render('admin-error-page', {
				builder: {
					header: await Middleware.buildHeader(),
				},
				siteInfo: {
					status: 429,
					message: 'Muitas solicitações',
					text: 'Pedimos sinceras desculpas pelo inconveniente causado. Nosso servidor está recebendo atualmente um número incomumente alto de solicitações do seu endereço IP. Como resultado, não podemos atender à sua solicitação neste momento. Por favor, tente novamente mais tarde ou entre em contato conosco se precisar de assistência imediata.',
					homePage: false,
				},
			});
		},
	}),
);

// Enable sessions
const MySQLStore = require('express-mysql-session')(session);

const expiration = 604800000;

const store = new MySQLStore(
	{
		checkExpirationInterval: expiration,
		expiration,
		createDatabaseTable: true,
		schema: {
			tableName: 'sessions',
			columnNames: {
				session_id: 'session_id',
				expires: 'expires',
				data: 'data',
			},
		},
	},
	Sql.mysqlConn,
);

app.use(
	session({
		name: process.env.SESSION_NAME!,
		secret: process.env.SESSION_SECRET!,
		resave: false,
		saveUninitialized: true,
		store,
		cookie: {
			httpOnly: true,
			sameSite: 'strict',
			maxAge: expiration,
			expires: new Date(Date.now() + expiration),
		},
	}),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('views'));

app.use('/admin', router);

//
// Listener
//

// Use '--port <port>' to change port (default port = 2003)
const port =
	Number(process.argv.slice(2)[process.argv.slice(2).indexOf('--port') + 1]) ||
	2003;

app.listen(port, () => {
	console.log(
		`\u001b[1;32m[v] Running\u001b[0m: \t (/admin) \t http://localhost:${port}`,
	);
});
