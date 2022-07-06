"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
Parse.Cloud.define('hello', (req) => {
    console.log('hello', req);
    const r = req;
    r.log.info(req);
    console.log('user-agent', r.headers['user-agent']);
    return 'Hi';
});
Parse.Cloud.define('test 2', (req) => {
    console.log('hello', req);
    const r = req;
    r.log.info(req);
    console.log('user-agent', r.headers['user-agent']);
    return 'Hi';
});
Parse.Cloud.job('myJob', async (request) => {
    // params: passed in the job call
    // headers: from the request that triggered the job
    // log: the ParseServer logger passed in the request
    // message: a function to update the status message of the job object
    const { params, headers, log, message } = request;
    message('I just started');
    // Do long running action
    await new Promise((resolve) => setTimeout(() => {
        message('Complete');
        resolve(true);
    }, 5000));
    return;
});
