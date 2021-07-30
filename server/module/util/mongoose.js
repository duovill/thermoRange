const mz = require('mz');
const mongoose = require('mongoose');
const _ = require('lodash');
const utils = require('corifeus-utils');
const path = require('path');
const glob = require('glob');

const schemaAuto = () => {

    /*
     mongoose.Schema.prototype._originalDefaultOptions = mongoose.Schema.prototype.defaultOptions;
     mongoose.Schema.prototype.defaultOptions = function(options) {
     if (options === undefined) {
     options = {};
     }
     options.timestamps = true;
     return this._originalDefaultOptions.apply(this._originalDefaultOptions, arguments);
     }
     */

    const schemaPath = `${process.cwd()}/server/schema`;
    const schemas = mz.fs.readdirSync(schemaPath);


    schemas.forEach((schemaName) => {
        const schemaFile = `${schemaPath}/${schemaName}`;
        schemaName = path.basename(schemaFile, '.js');
        const schema = require(schemaFile);

        if (global.ngivr.config.silent === false) {
            console.log(`Auto generate schema options for: ${schemaName}`);
        }

        schema.set('timestamps', true);

        schema.virtual('ngivrSchemaName')
            .get(function () {
                    return _.pascalCase(schemaName)
                }
            );

        if (schemaName !== 'pdf-file') {
            console.info('Generating schema with ngivrPdf reference', schemaName)
            schema.virtual('ngivrPdf', {
                ref: 'PdfFile', // The model to use
                localField: '_id', // Find people where `localField`
                foreignField: 'docId', // is equal to `foreignField`
                // If `justOne` is true, 'members' will be a single doc as opposed to
                // an array. `justOne` is false by default.
//    justOne: false,
                options: {
                    sort:
                        {
                            createdAt: -1
                        },
                    limit: 0
                } // Query options, see http://bit.ly/mongoose-query-options
            });
        }
        //console.warn('schema', schemaFile, schema.virtual)

        let getToJSON = schema.get('toJSON')
        if (getToJSON === undefined) {
            getToJSON = {}
        }
        //console.log('getToJSON', getToJSON)
        getToJSON.virtuals = true;
        schema.set('toJSON', getToJSON);

        //schema.set('toObject', {virtuals: true});
//    schema.set('autoIndex', true);
        schema.set('usePushEach', true);

        const updateTimestamp = function(next) {
            this.updatedAt = new Date()
            next()
        }

        schema.pre('save', updateTimestamp).pre('update', updateTimestamp ).pre('findOneAndUpdate', updateTimestamp)

        const uniqueErrorMiddleware =  (err, result, next) => {
            if (err.code === 11000) {
                /*
                  "status":"error",
           "message":"User validation failed: company: ERROR_MONGOOSE_UNIQUE_INDEX, username: ERROR_MONGOOSE_UNIQUE_INDEX",
           "errors":{
              "company":{
                 "properties":{
                    "message":"ERROR_MONGOOSE_UNIQUE_INDEX",
                    "type":"unique",
                    "path":"company",
                    "value":null
                 },
                 "kind":"unique",
                 "path":"company",
                 "value":null
              },
              "username":{
                 "properties":{
                    "message":"ERROR_MONGOOSE_UNIQUE_INDEX",
                    "type":"unique",
                    "path":"username",
                    "value":"admin"
                 },
                 "kind":"unique",
                 "path":"username",
                 "value":"admin"
              }
           }
        }
        https://stackoverflow.com/questions/38945608/custom-error-messages-with-mongoose
                 */

                err.errors = err.errors || {}
                const keys = Object.keys(err.keyPattern)
                for(let key of keys) {
                    err.errors[key] = {
                        properties: {
                            "message":"ERROR_MONGOOSE_UNIQUE_INDEX",
                            "type": "unique",
                            "path": key,
                            "value": err.keyValue[key]
                        },
                        kind:"unique",
                        path: key,
                        value: err.keyValue[key]
                    }
                }
            }
            next(err)
        }
        schema.post('save', uniqueErrorMiddleware).post('update', uniqueErrorMiddleware )
        //console.log(schema);
//    await utils.timer.wait(5000);

        /*
         schema.index({
         createdAt: -1,
         });
         schema.index({
         updatedAt: -1,
         });
         schema.index({
         ngivrSchemaName: 1,
         });
         */

    })
    // process.exit()
};

const populate = (request, mongooseQuery) => {
    if (request.body && request.body.hasOwnProperty('populate') && request.body.populate !== undefined) {
        if (!Array.isArray(request.body.populate)) {
            request.body.populate = [request.body.populate]
        }
        request.body.populate.forEach(populate => {
            if (typeof populate === 'object') {
                mongooseQuery.populate(populate.schema, populate.fields);
            } else {
                mongooseQuery.populate(populate);
            }

        })
    }
};

/*
const ensureModel = (schema) => {
  const modelName = _.camelCase(schema);
  require(`../../api/${modelName}/${modelName}.model`);
}
*/

const modelAuto = () => {
    const models = glob.sync('server/**/*.model.js');
    const load = (file) => {
        if (global.ngivr.config.silent === false) {
            console.info(`Load models ${file}`)
        }

        require(`${process.cwd()}/${file}`);
    };
    models.forEach(load);
};

module.exports.populate = populate;
//module.exports.ensureModel = ensureModel
module.exports.schemaAuto = schemaAuto;
module.exports.modelAuto = modelAuto;



