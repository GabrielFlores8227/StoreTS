import express from 'express';
import { rateLimit } from 'express-rate-limit';
import Middleware from 'storets-middleware';
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
router.use(
	rateLimit({
		windowMs: 15 * 60 * 1000,
		max: 400,
		handler: async (_: express.Request, res: express.Response) => {
			res.status(429).render('error-get-page', {
				builder: {
					header: await Middleware.buildHeader(),
				},
				status: 429,
				message: 'Too many requests',
				text: 'We sincerely apologize for the inconvenience caused. Our server is currently receiving an unusually high number of requests from your IP address. As a result, we are unable to fulfill your request at this time. Please try again later or contact us if you require immediate assistance.',
				homePage: false,
			});
		},
	}),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('views'));

app.use('/', router);

//
// Listener
//

// Use '--port <port>' to change port (default port = 2003)
const port =
	Number(process.argv.slice(2)[process.argv.slice(2).indexOf('--port') + 1]) ||
	2003;

app.listen(port, () => {
	console.log(
		'\u001b[1;32m[v] Running\u001b[0m: \t (/) \t\t http://localhost:' + port,
	);
});
