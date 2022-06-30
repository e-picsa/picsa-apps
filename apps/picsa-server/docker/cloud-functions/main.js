"use strict";
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
// Parse.Cloud.define('asyncFunction', async (req) => {
//   await new Promise((resolve) => setTimeout(resolve, 1000));
//   req.log.info(req);
//   return 'Hi async';
// });
