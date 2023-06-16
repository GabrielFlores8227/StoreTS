import express from 'express';
import { rateLimit } from 'express-rate-limit';
import Middleware from 'storets-middleware';
import router from './router/router';

const app = express();

// Enable trust for the proxy
app.set('trust proxy', 1);

// Apply rate limiting middleware
router.use(
	rateLimit({
		windowMs: 15 * 60 * 1000, // 15 minutes
		max: 400, // Maximum number of requests allowed within the window
		handler: async (_: express.Request, res: express.Response) => {
			// Handle rate limit exceeded error
			res.status(429).render('error-get-page', {
				builder: {
					header: await Middleware.buildHeader(), // Build the header data using the Middleware class
				},
				status: 429,
				message: 'Too many requests',
				text: 'We sincerely apologize for the inconvenience caused. Our server is currently receiving an unusually high number of requests from your IP address. As a result, we are unable to fulfill your request at this time. Please try again later or contact us if you require immediate assistance.',
				homePage: false,
			});
		},
	}),
);

// Set view engine to ejs
app.set('view engine', 'ejs');

// Serve static files from the 'views' directory
app.use(express.static('views'));

// Apply the router middleware
app.use('/', router);

// Set the desired port
const port =
	Number(process.argv.slice(2)[process.argv.slice(2).indexOf('--port') + 1]) ||
	2003;

// Start the server
app.listen(port, () => {
	console.log(
		'\u001b[1;32m[v] Running\u001b[0m: \t (/) \t\t http://localhost:' + port,
	);
});
