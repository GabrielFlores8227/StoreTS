import express from 'express';
import LocalModules from './.localModules';

const api: express.Router = express.Router();

//*NEW SECTION
api.post('/propagandas', LocalModules.middlewareUploadFiles(2, 2), LocalModules.middlewareCheckAuth, LocalModules.middlewarePostPropaganda, LocalModules.middlewareSendResponse(200));

api.delete('/propagandas', LocalModules.middlewareCheckAuth, LocalModules.middlewareDeletePropaganda, LocalModules.middlewareSendResponse(200));

//*NEW SECTION
api.post('/categories', LocalModules.middlewareCheckAuth, LocalModules.middlewarePostCategory, LocalModules.middlewareSendResponse(200));

api.delete('/categories', LocalModules.middlewareCheckAuth, LocalModules.middlewareDeleteCategory, LocalModules.middlewareSendResponse(200));

//*NEW SECTION
api.post('/products', LocalModules.middlewareUploadFiles(1, 1), LocalModules.middlewareCheckAuth, LocalModules.middlewarePostProduct, LocalModules.middlewareSendResponse(200));

api.delete('/products', LocalModules.middlewareCheckAuth, LocalModules.middlewareDeleteProduct, LocalModules.middlewareSendResponse(200));

//*NEW SECTION
api.put('/t/:table/:column', LocalModules.middlewareCheckAuth, LocalModules.middlewarePutText, LocalModules.middlewareSendResponse(200));

api.put('/i/:table/:column', LocalModules.middlewareUploadFiles(1, 1), LocalModules.middlewarePutImage, LocalModules.middlewareCheckAuth, LocalModules.middlewareSendResponse(200));

export default api;
