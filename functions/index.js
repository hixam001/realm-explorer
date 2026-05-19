require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const functions = require('firebase-functions');
const express = require('express');
const corsMiddleware = require('./middleware/corsMiddleware');
const errorHandler = require('./middleware/errorHandler');
const agentRoutes = require('./routes/agentRoutes');

const app = express();

app.use(corsMiddleware);
app.use(express.json());
app.use('/v1', agentRoutes);
app.use(errorHandler);

exports.api = functions.https.onRequest(app);
