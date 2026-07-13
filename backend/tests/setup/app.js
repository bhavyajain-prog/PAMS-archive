const express = require('express');
const cookieParser = require('cookie-parser');
const auth = require('../../routes/auth');
const common = require('../../routes/common');
const team = require('../../routes/team');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', auth);
app.use('/api/common', common);
app.use('/api/team', team);

module.exports = app;
