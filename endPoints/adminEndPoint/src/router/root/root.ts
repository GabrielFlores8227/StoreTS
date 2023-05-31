import express from 'express';
import { GlobalMiddlewareModules } from '../../globalModules';
import LocalModules from './localModules';
import api from './api/api';

const root = express.Router();

root.get(
	'/:message?',
	GlobalMiddlewareModules.buildHeaderMiddleware,
	(req, res) => {
		res.render('admin-get-page', { builder: Object(req).builder });
	},
);

root.post('/', LocalModules.middlewareCheckAuth, (req, res) => {
	res.sendStatus(200);
});

root.use('/api', api);

export default root;
