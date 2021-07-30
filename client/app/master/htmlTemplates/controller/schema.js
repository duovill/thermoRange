'use strict';
/**
 * Info about the current template, like schema
 *
 * Requires - load them from the controller:
 * this.$scope
 */
ngivr.api.htmlTemplate.controller.schema = function ($scope, $state, service, templateSchemaHelper) {

    this.$scope = $scope;
    this.$state = $state;
    this.service = service;

    this.variables = [];
    this.data = undefined;

    this.types = ngivr.settings.htmlTemplate.types.map((obj) => {
        //console.warn(obj, ngivr.strings.schema[obj])
        return new ngivr.api.htmlTemplate.model.schema(ngivr.strings.schema[obj], obj);
    });

    this.types = _.sortBy(this.types, 'name')

    this.treeOptions = {
        nodeChildren: "children",
        dirSelectable: false,
        injectClasses: {
            ul: "a1",
            li: "a2",
            liSelected: "a7",
            iExpanded: "a3",
            iCollapsed: "a4",
            iLeaf: "a5",
            label: "a6",
            labelSelected: "a8"
        }
    };

    this.tree = [];

    this.type = (type) => {
        const actualType = type.value;
        this.load(actualType).then(() => {
            this.$scope.template.mainSchema = actualType;
        }).catch(() => {
            this.$scope.template.mainSchema = undefined;
        });
    }

    const generateData = (type, dataInput) => {
        const schemaName = _.camelCase(type);
        const data = {};
        data[schemaName] = dataInput;
        this.data = data;
    }

    this.load = async (type) => {

        try {
            //console.warn('aha', templateSchemaHelper.getSchemaPost($scope.template.mainSchema))

            const promises = [
                this.service.api.schema(type)
            ]

            if (ngivr.mongoose.isId($scope.command.schema.customId)) {
                promises.push(
                    service.api.id(
                        type,
                        $scope.command.schema.customId,
                        templateSchemaHelper.getSchemaPost($scope.template.mainSchema),
                    )
                )
            } else {
                promises.push(
                    this.service.api.last(
                        type,
                        templateSchemaHelper.getSchemaPost($scope.template.mainSchema),
                    )

                )
            }

            const result = await Promise.all(promises)
            const schema = result[0].data;
            const schemaName = _.camelCase(type);
            generateData(type, result[1].data.doc)
            this.variables = ngivr.mongoose.schemaPath(schema, schemaName);
            this.tree = ngivr.mongoose.schemaPathTree(schema, schemaName + '.');
        } catch (e) {
            this.reset();
            ngivr.exception.handler(e);
        }
    }

    this.reset = () => {
        this.variables = [];
        this.filterText = undefined;
        this.data = undefined;
    }

    this.queryVariableSearch = (text) => {
        const regex = new RegExp(text, 'i');
        const query = this.variables.filter((variable) => {
            return variable.path.match(regex);
        });
        return query;
    }

    this.customId = undefined;

    $scope.$watch('command.schema.customId', async (newValue, oldValue) => {
        try {
            let response;
            if (ngivr.mongoose.isId(newValue)) {
                response = await service.api.id(
                    $scope.template.mainSchema,
                    newValue,
                    templateSchemaHelper.getSchemaPost($scope.template.mainSchema),
                )
            } else if ($scope.template.mainSchema !== undefined) {
                response = await this.service.api.last(
                    $scope.template.mainSchema,
                    templateSchemaHelper.getSchemaPost($scope.template.mainSchema),
                )
            }
            if (response) {
                generateData($scope.template.mainSchema, response.data.doc)
            }
        } catch (e) {
            ngivr.exception.handler(e);
        }
    })

};
