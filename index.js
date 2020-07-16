const express = require('express');
const app = express();

const functions = require('firebase-functions');

const FBAuth = require('./util/fbAuth');

const {
    createUser,
    getUsers,
    signUp,
    login,
    uploadImage,
    uploadFile,
    createEmployeeAccount,
    getUrl,
    uploadSignUrl
} = require('./handlers/users');

const {
    createJob,
    updateJob,
    addPotentialCandidate
} = require('./handlers/jobs');

app.post('/user', createUser);
app.get('/users', FBAuth, getUsers);
app.post('/signup', signUp);
app.post('/login', login);

app.post('/job', FBAuth, createJob);

app.post('/user/image', FBAuth, uploadImage);
app.post('/user/file', FBAuth, uploadFile);
app.put('/jobs/:jobId', FBAuth, updateJob);
app.put('/jobs/:jobId/:employeeId', FBAuth, addPotentialCandidate);
app.post('/newaccount', createEmployeeAccount);
app.get('/url', getUrl);
app.get('/uploadSignUrl', uploadSignUrl);

// https://baseurl.com/api/
exports.api = functions.https.onRequest(app);