const nodemailer = require('nodemailer');

let consolePrefix;

let mainFactory;

const service = function () {

    if (mainFactory !== undefined) {
        return mainFactory
    }

    const send = async (from, to, subject, body, attachments) => {
        if (body === undefined) {
            body = subject;
            subject = '';
        }

        const bodyBase = `
<strong>${new Date().toLocaleString()}</strong>
<br/><br/>
<strong>PID:</strong> ${process.pid}
`
        if (Array.isArray(body) && body.length === 1 && body[0] instanceof Error) {
            body = body[0]
        }

        if (body instanceof Error) {

            body = `
${bodyBase}
<pre>            
Error: ${body.message}
${body.stack}
</pre>            
            `
        } else if (typeof body === 'object') {
            body = `
${bodyBase}
<br/>
JSON:
<pre>
${JSON.stringify(body, null, 2)}
</pre>            
            `

        }

        body += `

Serve location: ${process.cwd()}    
`

        const message = {
            from: from,
            to: to,
            subject: subject,
            html: body,
            attachments: attachments
        };
        console.info(`${consolePrefix} send new mail subject: ${subject}`);

        try {
            let transporter = nodemailer.createTransport(global.ngivr.config.nodemailer.config);
            const info = await transporter.sendMail(message);
            console.log(info.response);
            transporter.close();
        } catch (e) {
            console.log(`send error email`, message);
            console.error(e, message);
        }
    }

    const factory = {
        send: async (options) => {
            let {body, subject, from, to, attachments} = options;

            from = from || global.ngivr.config.nodemailer.from
            to = to || global.ngivr.config.nodemailer.to
            await send(from, to, subject, body, attachments);
        },
        boot: async () => {

        }
    };

    mainFactory = factory;
    return factory;
};

service.prefix = '[EMAIL]';

consolePrefix = service.prefix;

console.info(`${consolePrefix} started`);


module.exports = service;

