/** Default request object omits some of the available data */
interface IRequest extends Parse.Cloud.FunctionRequest<Parse.Cloud.Params> {
  log: any;
  ip: string;
  headers: any;
  functionName: string;
  context: any;
  level: string;
}

Parse.Cloud.define('hello', (req) => {
  console.log('hello', req);
  const r = req as IRequest;
  r.log.info(req);
  console.log('user-agent', r.headers['user-agent']);
  return 'Hi';
});

// Parse.Cloud.define('asyncFunction', async (req) => {
//   await new Promise((resolve) => setTimeout(resolve, 1000));
//   req.log.info(req);
//   return 'Hi async';
// });
