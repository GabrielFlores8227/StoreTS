import express from 'express';
import Middleware from 'storets-middleware';
import LocalModules from './localModules';
import login from './login/login';
import logout from './logout/logout';
import api from './api/api';

const root = express.Router();

root.get(
	'/',
	(req, res, next) => {
		if (!Object(req).session.userId) {
			return res.redirect('/admin/login');
		} else {
			return next();
		}
	},
	LocalModules.middlewareGenerateToken,
	Middleware.middlewareBuildHeader(true),
	(req, res) => {
		res.render('admin-get-page', { builder: Object(req).builder });
	},
);

root.use('/api', api);
root.use('/login', login);
root.use('/logout', logout);

export default root;
