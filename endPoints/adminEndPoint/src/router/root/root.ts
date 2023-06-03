import express from 'express';
import LocalModules from './localModules';
import api from './api/api';
import Middleware from 'storets-middleware';

const root = express.Router();

root.get('/', Middleware.middlewareBuildHeader, (req, res) => {
	res.render('admin-get-page', { builder: Object(req).builder });
});

root.post(
	'/',
	LocalModules.middlewareCheckAuth,
	Middleware.middlewareBuildHeader,
	(_, res) => {
		res.sendStatus(200);
	},
);

root.use('/api', api);

export default root;
