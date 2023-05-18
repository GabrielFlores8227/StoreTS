import express from 'express';
import path from 'path';
import { GlobalMiddlewareModules } from '../globalModules';
import api from './api/api';

const root = express.Router();

root.get('/', (_: express.Request, res: express.Response) => {
	res.sendFile(path.join(GlobalMiddlewareModules.frontEndFolderPath, 'root-get-page/index.html'));
});

root.use('/api', api);

export default root;
