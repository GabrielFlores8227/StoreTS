import express from "express";
import ApiMiddlewares from "./apiMiddlewares";

const api: express.Router = express.Router();

api.post("/post/propaganda", ApiMiddlewares.middlewareUploadFiles("files", 2), ApiMiddlewares.middlewarePostPropaganda, ApiMiddlewares.middlewareSendStatusCode200);

api.post("/post/category", ApiMiddlewares.middlewarePostCategory, ApiMiddlewares.middlewareSendStatusCode200)

api.post("/post/product", ApiMiddlewares.middlewareSendStatusCode200)

export default api;
