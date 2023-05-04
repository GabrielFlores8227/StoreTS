import express from "express";
import ApiMiddlewares from "./apiMiddlewares";

const api: express.Router = express.Router();

api.post("/post/propaganda", ApiMiddlewares.middlewareUploadFiles("files", 2), ApiMiddlewares.middlewarePostPropaganda, ApiMiddlewares.middlewareSendStatusCode200);

api.post("/post/category", ApiMiddlewares.middlewarePostCategory, ApiMiddlewares.middlewareSendStatusCode200);

api.post("/post/product", ApiMiddlewares.middlewareUploadFiles("files", 1), ApiMiddlewares.middlewarePostProduct, ApiMiddlewares.middlewareSendStatusCode200);

api.put("/put/text", ApiMiddlewares.middlewareUpdateText, ApiMiddlewares.middlewareSendStatusCode200);

api.put("/put/image", ApiMiddlewares.middlewareUploadFiles("files", 1), ApiMiddlewares.middlewareUpdateImage, ApiMiddlewares.middlewareSendStatusCode200);

api.put("/put/position", ApiMiddlewares.middlewareUpdatePosition, ApiMiddlewares.middlewareSendStatusCode200);

api.delete("/delete/propaganda", ApiMiddlewares.middlewareDeletePropaganda, ApiMiddlewares.middlewareSendStatusCode200);

api.delete("/delete/category", ApiMiddlewares.middlewareDeleteCategory, ApiMiddlewares.middlewareSendStatusCode200);

api.delete("/delete/product", ApiMiddlewares.middlewareDeleteProduct, ApiMiddlewares.middlewareSendStatusCode200);

export default api;
