import express from 'express';
import { GlobalMiddlewareModules } from '../../globalModules';
import LocalModules from './localModules';

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

export default root;
