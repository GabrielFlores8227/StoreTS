import express from 'express';
import { cwd } from 'process';
import path from 'path';

const root: express.Router = express.Router();

root.get('/', (req: express.Request, res: express.Response) => {
	res.sendFile(path.join(cwd(), 'src/front/home-page/index.html'));
});

export default root;
