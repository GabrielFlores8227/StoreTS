import express from 'express';
import router from './router/router';

const app = express();

app.set('view engine', 'ejs');

app.use(express.static('views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', router);

const port = 2000;
app.listen(port, () => {
	console.log(
		'\u001b[1;32m[v] Running\u001b[0m: \t (/) \t http://localhost:' + port,
	);
});
