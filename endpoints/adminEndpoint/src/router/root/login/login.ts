import express from 'express';
import Middleware from 'storets-middleware';
import { rateLimit } from 'express-rate-limit';
import LocalModules from './localModules';

const login = express.Router();

login.get(
	'/',
	(req, res, next) => {
		if (Object(req).session.sessionID) {
			return res.redirect('/admin');
		} else {
			return next();
		}
	},
	Middleware.middlewareBuildHeader(),
	(req, res) => {
		res.render('admin-form-page', {
			builder: Object(req).builder,
			siteInfo: {
				title: 'Login',
				form: {
					method: 'POST',
					action: '/admin/login',
					authentication: false,
					firstInput: {
						type: 'text',
						name: 'username',
						placeholder: 'Usuário',
						maxLength: 30,
					},
					secondInput: {
						type: 'password',
						name: 'password',
						placeholder: 'Senha',
						maxLength: 30,
					},
					button: {
						icon: 'fa-solid fa-right-to-bracket',
						name: 'Login',
					},
				},
			},
		});
	},
);

login.post(
	'/',
	rateLimit({
		windowMs: 20 * 60 * 1000,
		max: 30,
		handler: (_, res) => {
			res
				.status(429)
				.redirect(
					`/admin/login?message=${String(
						'Devido ao número máximo de tentativas de login ser atingido, sua conta será bloqueada temporariamente por alguns minutos neste dispositivo.',
					).replace(/ /g, '%20')}`,
				);
		},
	}),
	LocalModules.middlewareCheckAuth,
	(req, res) => {
		Object(req).session.sessionID = req.sessionID;

		res.redirect('/admin');
	},
);

export default login;
