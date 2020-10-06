const env = process.env;
const apm = env.AO_TEST_LAMBDA_APM || 'appoptics-apm';
const runtime = env.AO_TEST_LAMBDA_RUNTIME || '/var/runtime/UserFunction';

// this duplicates the logic in the agent.
const envSetting = env.APPOPTICS_ENABLED && env.APPOPTICS_ENABLED.toLowerCase() || 'true';
const enabled = ~['true', 't', '1', 'yes', 'y', 'on'].indexOf(envSetting);

const taskRoot = env.LAMBDA_TASK_ROOT || '';
const handler = env.APPOPTICS_WRAP_LAMBDA_HANDLER || '';

let userHandler;
try {
  // use the lambda runtime's loader logic.
  const {load} = require(runtime);
  userHandler = load(taskRoot, handler);
} catch (e) {
  // eslint-disable-next-line no-console
  console.error('failed to load APPOPTICS_WRAP_LAMBDA_HANDLER:', e);
}

// only load our agent code if not disabled and the user handler
// was loaded.
if (enabled && userHandler) {
  const ao = require(apm);

  // if nothing caused the agent to be disabled then
  // wrap the user's handler.
  if (ao.cfg.enabled) {
    userHandler = ao.wrapLambdaHandler(userHandler);
    ao.loggers.debug(`wrapped ${taskRoot} ${handler}`);
  }
}

module.exports = {
  handler: userHandler,
}
