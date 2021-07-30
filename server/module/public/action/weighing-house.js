module.exports = async (req, res) => {

    try {
        const WeighingHouse = require('../../../api/weighingHouse/weighing-house.model.js');

        const weighingHousesAll = await WeighingHouse.find().exec();
        res.json({
            docs: weighingHousesAll
        });

    } catch (e) {

        res.status(501).json({
            status: 'error',
            error: e,
        })

    }


}
