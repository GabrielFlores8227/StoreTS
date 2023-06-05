import express from 'express';
import { rateLimit } from 'express-rate-limit';
import Middleware from 'storets-middleware';
import root from './root/root';

const router = express.Router();

// Apply rate limiting middleware to limit requests
router.use(
	rateLimit({
		windowMs: 15 * 60 * 1000, // 15 minutes
		max: 150, // Maximum number of requests allowed per window
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

// Use the root router for handling other routes
router.use('/', root);

// Handle 404 errors with the error page
router.get('*', Middleware.middlewareBuildHeader, (req, res) => {
	res.status(404).render('error-get-page', {
		builder: Object(req).builder,
		status: 404,
		message: 'Page not found',
		text: 'We sincerely apologize for the inconvenience caused. It seems that the page you are looking for cannot be found. Please go back to the homepage or contact us.',
		homePage: true,
	});
});

export default router;
