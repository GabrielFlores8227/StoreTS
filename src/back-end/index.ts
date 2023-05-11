import express from 'express';
import { GlobalMiddlewareModules } from './router/globalModules';
import router from './router/router';

const app: express.Express = express();

/*
If you are behind a proxy/load balancer the IP address of the request might be 
the IP of the load balancer/reverse proxy (making the rate limiter effectively 
a global one and blocking all requests once the limit is reached) or undefined.
To solve this issue, use 'app.set('trust proxy', 1). Where numberOfProxies is 
the number of proxies between the user and the server. '
*/
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(GlobalMiddlewareModules.frontEndFolderPath));

app.use('/', router);

const port: number = 2003;
app.listen(port, () => {
	console.clear();
	console.log('🟢 http://localhost:' + port);
});
