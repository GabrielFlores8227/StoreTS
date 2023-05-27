import express from 'express';
import LocalModules from './localModules';

const root = express.Router();

root.get('/', LocalModules.middlewareGetRoot, (req, res) => {
	res.render('root-get-page', { builder: Object(req).builder });
});

export default root;
