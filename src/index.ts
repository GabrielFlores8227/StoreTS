import express from "express";
import router from "./router/router";

const app: express.Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", router);

const port: number = 2003;
app.listen(port, () => {
	console.clear();
	console.log("🟢 http://localhost:" + port);
});
