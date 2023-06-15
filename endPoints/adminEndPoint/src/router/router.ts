import express from 'express';
import Middleware from 'storets-middleware';
import root from './root/root';

const router = express.Router();

// Use the root router for handling other routes
router.use('/', root);

// Handle 404 errors with the error page
router.get('*', Middleware.middlewareBuildHeader(), (req, res) => {
	res.status(404).render('error-get-page', {
		builder: Object(req).builder,
		status: 404,
		message: 'Page not found',
		text: 'We sincerely apologize for the inconvenience caused. It seems that the page you are looking for cannot be found. Please go back to the homepage or contact us.',
		homePage: true,
	});
});

export default router;
