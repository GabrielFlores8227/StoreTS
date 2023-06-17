import express from 'express';
import Middleware from 'storets-middleware';
import LocalModules from './localModules';

const login = express.Router();

login.get(
	'/',
	(req, res, next) => {
		if (Object(req).session.userId) {
			return res.status(401).redirect('/admin');
		} else {
			return next();
		}
	},
	Middleware.middlewareBuildHeader(),
	(req, res) => {
		res.render('admin-login-get-page', { builder: Object(req).builder });
	},
);

login.post('/', LocalModules.middlewareCheckAuth, (req, res) => {
	Object(req).session.sessionID = req.sessionID;

	res.redirect('/admin');
});

export default login;
