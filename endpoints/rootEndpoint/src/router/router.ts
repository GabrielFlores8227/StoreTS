import express from 'express';
import Middleware from 'storets-middleware';
import root from './root/root';

const router = express.Router();

router.use('/', root);

router.get('*', Middleware.middlewareBuildHeader(), (req, res) => {
	res.status(404).render('error-page', {
		builder: Object(req).builder,
		siteInfo: {
			status: 404,
			message: 'Página não encontrada',
			text: 'Pedimos sinceras desculpas pelo inconveniente causado. Parece que a página que você está procurando não pode ser encontrada. Por favor, retorne à página inicial ou entre em contato conosco.',
			homePage: true,
		},
	});
});

export default router;
