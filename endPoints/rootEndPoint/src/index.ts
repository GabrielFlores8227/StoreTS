import express from 'express';
import router from './router/router';

const app = express();

// Trust the proxy IP address
app.set('trust proxy', 1);

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Serve static files from the 'views' directory
app.use(express.static('views'));

// Use the router for handling routes
app.use('/', router);

const port = 2000;
app.listen(port, () => {
	console.log(
		'\u001b[1;32m[v] Running\u001b[0m: \t (/) \t\t http://localhost:' + port,
	);
});
