import express from 'express';
import path from 'path';
import { GlobalMiddlewareModules } from '../globalModules';
import LocalModules from './localModules';
import api from './api/api';

const admin = express.Router();

admin.get('/', (_: express.Request, res: express.Response) => {
	res.sendFile(path.join(GlobalMiddlewareModules.frontEndFolderPath, 'admin-get-page/index.html'));
});

admin.post('/', LocalModules.middlewarePostAdmin, (_: express.Request, res: express.Response) => {
	res.sendStatus(200);
});

admin.use('/api', api);

export default admin;
