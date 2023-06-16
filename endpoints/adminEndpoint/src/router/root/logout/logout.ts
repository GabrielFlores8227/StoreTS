import express from 'express';
import LocalModules from './localModules';

const logout = express.Router();

logout.get('/', LocalModules.middlewareLogout, (_, res) => {
	res.redirect('/admin/login');
});

export default logout;
