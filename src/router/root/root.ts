import express from 'express';
import api from './api/api';

const root = express.Router();

root.use('/api', api);

export default root;
