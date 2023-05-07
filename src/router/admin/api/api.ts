import express from 'express';
import LocalModules from './.localModules';

const api: express.Router = express.Router();

//*NEW SECTION
api.post('/propaganda', LocalModules.middlewareUploadFiles(2, 2), LocalModules.middlewareCheckToken, LocalModules.middlewarePostPropaganda, LocalModules.middlewareSendResponse(200));

api.delete('/propaganda', LocalModules.middlewareCheckToken, LocalModules.middlewareDeletePropaganda, LocalModules.middlewareSendResponse(200));

//*NEW SECTION
api.post('/category', LocalModules.middlewareCheckToken, LocalModules.middlewarePostCategory, LocalModules.middlewareSendResponse(200));

/*
api.post('/category', LocalModules.middlewareCheckToken, LocalModules.middlewarePostCategory, LocalModules.middlewareSendResponse(200));

api.post('/product', LocalModules.middlewareUploadFiles(1, 1), LocalModules.middlewareCheckToken, LocalModules.middlewarePostProduct, LocalModules.middlewareSendResponse(200));

api.put('/login', LocalModules.middlewareCheckToken, LocalModules.middlewarePutLogin, LocalModules.middlewareSendResponse(200));

api.put('/text', LocalModules.middlewareCheckToken, LocalModules.middlewarePutText, LocalModules.middlewareSendResponse(200));

api.put('/image', LocalModules.middlewareUploadFiles('files', 1), LocalModules.middlewareCheckToken, LocalModules.middlewarePutImage, LocalModules.middlewareSendResponse(200));

api.put('/position', LocalModules.middlewareCheckToken, LocalModules.middlewarePutPosition, LocalModules.middlewareSendResponse(200));

api.delete('/propaganda', LocalModules.middlewareCheckToken, LocalModules.middlewareDeletePropaganda, LocalModules.middlewareSendResponse(200));

api.delete('/category', LocalModules.middlewareCheckToken, LocalModules.middlewareDeleteCategory, LocalModules.middlewareSendResponse(200));

api.delete('/product', LocalModules.middlewareCheckToken, LocalModules.middlewareDeleteProduct, LocalModules.middlewareSendResponse(200));
*/

export default api;
