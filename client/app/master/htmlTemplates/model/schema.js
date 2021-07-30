'use strict';
ngivr.api.htmlTemplate.model.schema = class {
  /**
   * Just the type schemas.
   * @param name Name of the schema, like in Hungarians
   * @param value The actual schema name (like ServiceContract, Order etc..)
   */
  constructor(name, value) {
    this.name = name;
    this.value = value;
  }
};
