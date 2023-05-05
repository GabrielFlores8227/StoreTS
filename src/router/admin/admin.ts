import express from 'express';
import api from './api/api';

const admin = express.Router();

admin.use('/api', api);

export default admin;
