ngivr.json = new function() {

    this.equals = (o1, o2) => {
        const o1json = this.stringify(o1);
        const o2json = this.stringify(o2);
        return o1json === o2json;
    }

    this.clone = (o) => {
        return this.parse(this.stringify(o));
    }

    this.parse = (json) => {
        if (json === undefined) {
            return undefined;
        }
        return JSON.parse(json);
    }

    this.stringify = (o) => {
        return angular.toJson(o);
    }

    this.assign = (original, newData) => {
       // if ((original.hasOwnProperty('$$hashKey') && newData.hasOwnProperty('$$hashKey') && original.$$hashKey === newData.$$hashKey) || original === newData) {
       //     return
       // }
//        console.warn('original and newData before delete', original, newData)
   /*
        Object.keys(original).forEach(function (key) {
            if (key.startsWith('$$')) {
                return;
            }
            delete original[key];
        });
        */
//        console.warn('original and newData before', original, newData)
        Object.assign(original, newData);
//        console.warn('original and newData after', original, newData)
    }
}
