import express from 'express';
import Middleware from 'storets-middleware';
import LocalModules from './localModules';
import crypto from 'crypto';
import api from './api/api';

const root = express.Router();

root.get(
	'/profile',
	LocalModules.middlewareCheckUserId,
	LocalModules.middlewareGenerateToken,
	Middleware.middlewareBuildHeader,
	(req, res) => {
		res.render('admin-post-page', { builder: Object(req).builder });
	},
);

root.get('/login', Middleware.middlewareBuildHeader, (req, res) => {
	res.render('admin-get-page', { builder: Object(req).builder });
});

root.post('/login', LocalModules.middlewareCheckAuth, (req, res) => {
	Object(req).session.userId = crypto.randomBytes(64).toString();

	res.redirect('/admin/profile');
});

root.get('/logout', LocalModules.middlewareLogout, (_, res) => {
	res.redirect('/admin/login');
});

root.use('/api', api);

export default root;
