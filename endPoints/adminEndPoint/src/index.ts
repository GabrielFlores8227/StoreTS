import express from 'express';
import { rateLimit } from 'express-rate-limit';
import Middleware from 'storets-middleware';
import session from 'express-session';
import router from './router/router';

const app = express();

// Apply rate limiting middleware to limit requests
// Trust the proxy IP address
app.set('trust proxy', 1);

router.use(
	rateLimit({
		windowMs: 15 * 60 * 1000, // 15 minutes
		max: 400, // Maximum number of requests allowed per window
		handler: async (_: express.Request, res: express.Response) => {
			// Render the error page for too many requests
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

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Set express-session
app.use(
	session({
		secret: process.env.SECRET!,
		resave: false,
		saveUninitialized: true,
	}),
);

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'views' directory
app.use(express.static('views'));

// Use the router for handling '/admin' routes
app.use('/admin', router);

const port = 2001;
app.listen(port, () => {
	console.log(
		'\u001b[1;32m[v] Running\u001b[0m: \t (/admin) \t http://localhost:' + port,
	);
});
