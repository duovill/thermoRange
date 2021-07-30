const utils = require('corifeus-utils')
const _ = require('lodash')

const queryRegexSearchHelper = (options) => {

    const { query } = options;

    if (typeof query.search === 'object' || (query.search instanceof Array)) {
        const querySearch = JSON.parse(JSON.stringify(query.search))
        console.warn('querySearch', JSON.stringify(query.search, null, 4))

        const iterateObject = (obj, root = obj) => {
            if (obj instanceof Array) {
                //console.warn('iterateObject array', obj)
                for(let index in obj) {
                    iterateObject(obj[index], obj)
                }
                return;
            }
            if (typeof obj === 'object') {
                for(let prop of Object.keys(obj)) {
                    //console.warn('iterateObject obj prop', prop, obj[prop])
                    if (prop === '$regex') {
                        obj[prop] = `^${utils.regexp.escape(obj[prop])}`
                    }
                    console.warn(prop, obj)
                    if (!_.isEmpty(obj[prop])) {
                        iterateObject(obj[prop], obj)
                    }
                }
                return;
            }
            //console.warn('iterateObject obj, root', obj, root)
        }

        iterateObject(querySearch)
        if (!query.hasOwnProperty('settings')) {
            query.settings = {}
        }
        query.settings.generatedSearch = querySearch
        query.search = querySearch
    }


}

module.exports.queryRegexSearchHelper = queryRegexSearchHelper
