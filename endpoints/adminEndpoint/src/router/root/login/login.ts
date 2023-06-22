import express from 'express';
import Middleware from 'storets-middleware';
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

login.post('/', LocalModules.middlewareCheckAuth, (req, res) => {
	Object(req).session.sessionID = req.sessionID;

	res.redirect('/admin');
});

export default login;
