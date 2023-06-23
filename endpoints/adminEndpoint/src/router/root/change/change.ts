import express from 'express';
import Middleware from 'storets-middleware';
import LocalModules from './localModules';
import api from './api/api';

const change = express.Router();

change.get(
	['/username', '/password'],
	(req, res, next) => {
		if (Object(req).session.sessionID) {
			return next();
		} else {
			return res.redirect('/admin/login');
		}
	},
	LocalModules.middlewareGetToken,
	Middleware.middlewareBuildHeader(true),
	(req, res) => {
		const url = req.originalUrl.split('/');
		const key = url[url.length - 1] === 'username' ? 'Usuário' : 'Senha';

		res.render('admin-form-page', {
			builder: Object(req).builder,
			siteInfo: {
				title: `Trocar ${key}`,
				form: {
					method: 'PUT',
					action: `/admin/change/api/${url[url.length - 1]}`,
					authentication: true,
					firstInput: {
						type: key === 'Usuário' ? 'text' : 'password',
						name: 'change',
						placeholder: key === 'Usuário' ? 'Novo Usuário' : 'Nova Senha',
						maxLength: 30,
					},
					secondInput: {
						type: key === 'Usuário' ? 'text' : 'password',
						name: 'confirm',
						placeholder:
							key === 'Usuário'
								? 'Confirme Novo Usuário'
								: 'Confirme Nova Senha',
						maxLength: 30,
					},
					thirdInput: {
						type: 'password',
						name: 'password',
						placeholder: 'Senha',
						maxLength: 30,
					},
					button: {
						icon: key === 'Usuário' ? 'fa-solid fa-user' : 'fa-solid fa-lock',
						name: key === 'Usuário' ? 'Trocar Usuário' : 'Trocar Senha',
					},
					a: {
						icon: 'fa-solid fa-right-to-bracket',
						name: 'Voltar',
						href: '/admin',
					},
				},
			},
		});
	},
);

change.use('/api', api);

export default change;
