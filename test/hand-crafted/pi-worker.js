const path = require('path');

(async() => {

    try {

        const thermo = require('../../build/Release/thermo')
        const pi = await thermo.piWorker(10000000)
        console.log('await', pi)
        const qrcode = await thermo.readQrCode(path.resolve("./data/qr-code.jpg"))
        console.log('qrcode', qrcode)

    } catch(e) {
        console.error('node-addon-api error')
        console.error(e);
    }

    console.log('')

})()
