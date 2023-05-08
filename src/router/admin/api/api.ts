import express from 'express';
import LocalModules from './.localModules';

const api: express.Router = express.Router();

//*NEW SECTION
api.post('/propaganda', LocalModules.middlewareUploadFiles(2, 2), LocalModules.middlewareCheckAuth, LocalModules.middlewarePostPropaganda, LocalModules.middlewareSendResponse(200));

api.delete('/propaganda', LocalModules.middlewareCheckAuth, LocalModules.middlewareDeletePropaganda, LocalModules.middlewareSendResponse(200));

//*NEW SECTION
api.post('/category', LocalModules.middlewareCheckAuth, LocalModules.middlewarePostCategory, LocalModules.middlewareSendResponse(200));

api.delete('/category', LocalModules.middlewareCheckAuth, LocalModules.middlewareDeleteCategory, LocalModules.middlewareSendResponse(200));

//*NEW SECTION
api.post('/product', LocalModules.middlewareUploadFiles(1, 1), LocalModules.middlewareCheckAuth, LocalModules.middlewarePostProduct, LocalModules.middlewareSendResponse(200));

api.delete('/product', LocalModules.middlewareCheckAuth, LocalModules.middlewareDeleteProduct, LocalModules.middlewareSendResponse(200));

//*NEW SECTION
api.put('/text', LocalModules.middlewareCheckAuth, LocalModules.middlewarePutText, LocalModules.middlewareSendResponse(200));

/*

api.put('/login', LocalModules.middlewareCheckAuth, LocalModules.middlewarePutLogin, LocalModules.middlewareSendResponse(200));


api.put('/image', LocalModules.middlewareUploadFiles('files', 1), LocalModules.middlewareCheckAuth, LocalModules.middlewarePutImage, LocalModules.middlewareSendResponse(200));

api.put('/position', LocalModules.middlewareCheckAuth, LocalModules.middlewarePutPosition, LocalModules.middlewareSendResponse(200));



api.delete('/product', LocalModules.middlewareCheckAuth, LocalModules.middlewareDeleteProduct, LocalModules.middlewareSendResponse(200));
*/

export default api;
