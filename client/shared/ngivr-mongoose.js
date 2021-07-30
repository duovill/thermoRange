'use strict';
(() => {
  const ngivrMongoose = new function() {

    this.isId = (value) => {
      return /^[a-fA-F0-9]{24}$/.test(value);
    }

    this.clean = (data) => {
      delete data._id;
      delete data.updatedAt;
      delete data.createdAt;
      delete data.__v;
    }

    const generateTree = (data, node) => {
      if (node === undefined) {
        this.tree = [];
        node = this.tree;
      }
      for(let prop in data) {
        const currentNode = {};
        currentNode.name = prop;
        currentNode.type = typeof data[prop];
        node.push(currentNode);
        if (currentNode.type === 'object') {
          currentNode.children = [];
          generateTree(data[prop], currentNode.children)
        } else {
          currentNode.value = data[prop];
        }
      }
    }
    this.schemaPathTree = function(schema, root, node) {
      if (node === undefined) {
//        console.log(arguments)
        node = [];
      }

      for(let key in schema.paths) {
        const pathCurrent = schema.paths[key];
        const path = root +  key;
        let template;
        let display;
        const currentNode = {}
        if (pathCurrent.instance === 'Array') {
          currentNode.children = [];
          template = `
<span ng-repeat="${key} in ${ root + key  }">
  
</span>
`;
        } else {
          template = '{{ ' + root + key + ' }}';
        }
        currentNode.template = template,
        currentNode.path = path,
        currentNode.type = pathCurrent.instance,
        currentNode.key =  key,
        currentNode.name = path
        node.push(currentNode);
        if (pathCurrent.hasOwnProperty('schema')) {
          const generatedKey = pathCurrent.instance === 'Array' ? key + '.' : root + key + '.';
          this.schemaPathTree(pathCurrent.schema, generatedKey, currentNode.children);
        }
      }
      return node.sort((a, b) => {
        let nameA = a.path.toUpperCase(); // ignore upper and lowercase
        let nameB = b.path.toUpperCase(); // ignore upper and lowercase
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        // names must be equal
        return 0;
      });
    }

    this.schemaPath = function(schema, root, recursived) {

      root = root == undefined ? '' : root + '.';
      if (recursived != undefined)  {
        recursived = root;
      } else {
        recursived = root;
      }
      let keys = [];
      for(var key in schema.paths) {
        const pathCurrent = schema.paths[key];
        const variable = key;
        const path = root + key;
        let template;
        let display;
        if (pathCurrent.instance == 'Array') {
          display = root + '<span style="font-weight: bold;">' + key + '[]</span>';
          template = `
<span ng-repeat="${key} in ${ recursived + key  }">
  
</span>
`;
        } else {
          display = root + key;
          template = '{{ ' + recursived + key + ' }}';
        }
        keys.push({
          display: display,
          template: template,
          path: path,
          key: key
        });
        if (pathCurrent.hasOwnProperty('schema')) {
          const innerKeys = this.schemaPath(pathCurrent.schema, root + variable, true);
          keys = keys.concat(innerKeys);
        }
      }
      return keys.sort((a, b) => {
        var nameA = a.path.toUpperCase(); // ignore upper and lowercase
        var nameB = b.path.toUpperCase(); // ignore upper and lowercase
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        // names must be equal
        return 0;
      });
    }
  };

  const isModule = typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined' && typeof(window) === 'undefined';
  const isWindow = typeof(window) !== 'undefined';

  if (isWindow ) {
    ngivr.mongoose = ngivrMongoose;
  } else if(isModule) {
    module.exports = ngivrMongoose;
  }

})();
