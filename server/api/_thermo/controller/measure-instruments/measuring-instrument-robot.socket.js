module.exports.register = function(socket) {

  // console.info('Registering robot socket functions')

    socket.on('ping', (data) => {
        const MeasureInstrumentsController = require('./index');
        (async (socket, data) => {
            let response = await MeasureInstrumentsController.ping(socket, data);
            if ('' != response.event) {
                socket.emit(response.event, response.message);
            }
        })(socket, data);
    })


    socket.on('thermal_camera_image', (data) => {
        const MeasureInstrumentsController = require('./index');
        (async (socket, data) => {
            let response = await MeasureInstrumentsController.thermalImageReceived(socket, data);
            if ('' != response.event) {
                socket.emit(response.event, response.message);
            }
        })(socket, data);
    })

};

