import express from 'express';
import { GlobalMiddlewareModules } from './router/globalModules';
import router from './router/router';

const app: express.Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(GlobalMiddlewareModules.frontEndFolderPath));

app.use('/', router);

const port: number = 2003;
app.listen(port, () => {
	console.clear();
	console.log('🟢 http://localhost:' + port);
});
