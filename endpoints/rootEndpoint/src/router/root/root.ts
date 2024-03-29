import express from 'express';
import Middleware from 'storets-middleware';
import api from './api/api';
import LocalModules from './localModules';

const root = express.Router();

root.get(
	'/',
	LocalModules.middlewareGetRoot,
	Middleware.middlewareBuildHeader(),
	Middleware.middlewareBuildPopUp(),
	Middleware.middlewareBuildPropagandas(),
	Middleware.middlewareBuildProducts(),
	Middleware.middlewareBuildFooter(),
	(req, res) => {
		res.render('root-page', {
			builder: Object(req).builder,
		});
	},
);

root.use('/api', api);

export default root;
