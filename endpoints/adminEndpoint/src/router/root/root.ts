import express from 'express';
import Middleware from 'storets-middleware';
import LocalModules from './localModules';
import login from './login/login';
import logout from './logout/logout';
import change from './change/change';
import api from './api/api';

const root = express.Router();

root.get(
	'/',
	(req, res, next) => {
		if (Object(req).session.sessionID) {
			return next();
		} else {
			return res.redirect('/admin/login');
		}
	},
	LocalModules.middlewareGenerateToken,
	Middleware.middlewareBuildHeader(true),
	Middleware.middlewareBuildPopUp(true),
	Middleware.middlewareBuildFooter(),
	(req, res) => {
		res.render('admin-page', { builder: Object(req).builder });
	},
);

root.use('/login', login);
root.use('/logout', logout);
root.use('/change', change);
root.use('/api', api);

export default root;
