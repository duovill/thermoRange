const config = require('./config/environment');
const email = require('./module/email')();

const catchError = async (err) => {
  global.ngivr = {
    config: config
  }

  console.error(err)
  if (process.send) {
    process.send({
      cmd: 'error',
      'NGIVR_SERVER_COMMAND': process.env.NGIVR_SERVER_COMMAND,
      pid: process.pid,
      signal: 'own',
      code: 1,
    });
  }
  if (process.env.NGIVR_ERROR_EMAIL !== undefined) {
    try {
      await email.send({
        subject: `NGIVR ${process.env.NODE_ENV} process died env: ${process.env.NGIVR_SERVER_COMMAND}`,
        body: `
On ${new Date().toLocaleString()}        
<br/>
DIED WORKER PID: ${process.pid} ENV: ${process.env.NGIVR_SERVER_COMMAND}
<br/>
The error:
<pre>
<strong>Message</strong>:
${err.message}

<strong>Stack</strong>:
${err.stack}
</pre>
`
      })
    } catch (e) {
      console.error(`cannot send email `,e);
    }
  }
  process.exit(1);
}

module.exports.catchError = catchError;

module.exports.init = () => {
  process.on("unhandledRejection", async (err, promise) => {
    await catchError(err);
  });

  process.on('uncaughtException', async (err) => {
    await catchError(err);
  });

}

