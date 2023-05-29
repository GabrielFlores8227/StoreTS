import express from 'express';
import LocalModules from './localModules';
import api from './api/api';

const root = express.Router();

root.get('/', LocalModules.middlewareGetBuilder, (req, res) => {
	res.render('root-get-page', { builder: Object(req).builder });
});

root.use('/api', api);

export default root;
