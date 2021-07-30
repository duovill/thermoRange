const utils = require('corifeus-utils');
const dns = require('dns');
const { promisify } = require('util');

const reverse = promisify(dns.reverse);

const myIpHost = async () => {
  try {
    const { body } = await utils.http.request('https://ident.me/.json');
    const hostname = await reverse(body.address);
    return {
      ip: body.address,
      hostname: hostname
    }
  } catch (e) {
    return e;
  }
}

myIpHost.html = async() => {
  const thisMyIp = await myIpHost();
  return `
<br/>
The user ip/hostname:<br/>
<pre>
${JSON.stringify(thisMyIp, null, 4)}
</pre>
<br/>  
  `
}

module.exports = myIpHost;

