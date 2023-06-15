import express from 'express';
import Middleware from 'storets-middleware';
import LocalModules from './localModules';
import crypto from 'crypto';
import api from './api/api';

const root = express.Router();

root.get(
	'/',
	LocalModules.middlewareCheckUserId,
	LocalModules.middlewareGenerateToken,
	Middleware.middlewareBuildHeader(true),
	Middleware.middlewareBuildCategories(),
	(req, res) => {
		res.render('admin-get-page', { builder: Object(req).builder });
	},
);

root.get('/login', Middleware.middlewareBuildHeader(), (req, res) => {
	res.render('admin-login-get-page', { builder: Object(req).builder });
});

root.get('/logout', LocalModules.middlewareLogout, (_, res) => {
	res.redirect('/admin/login');
});

root.post('/login', LocalModules.middlewareCheckAuth, (req, res) => {
	Object(req).session.userId = crypto.randomBytes(64).toString();

	res.redirect('/admin');
});

root.use('/api', api);

export default root;
