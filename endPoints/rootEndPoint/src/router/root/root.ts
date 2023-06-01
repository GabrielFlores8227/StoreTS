import express from 'express';
import api from './api/api';
import { GlobalMiddlewareModules } from '../../globalModules';
import LocalModules from './localModules';

const root = express.Router();

root.get(
	'/',
	LocalModules.middlewareGetRoot,
	GlobalMiddlewareModules.middlewareBuildHeader,
	GlobalMiddlewareModules.middlewareBuildPropagandas,
	GlobalMiddlewareModules.middlewareBuildProductsForClient,
	GlobalMiddlewareModules.middlewareBuildFooter,
	(req, res) => {
		res.render('root-get-page', { builder: Object(req).builder });
	},
);

root.use('/api', api);

export default root;
