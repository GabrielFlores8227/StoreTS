import express from 'express';
import LocalModules from './localModules';

const api = express.Router();

api.get('/order/:id', LocalModules.middlewareGetOrder, (req, res) => {
	return res.redirect(Object(req).redirectTo);
});

export default api;
