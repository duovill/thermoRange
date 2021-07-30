'use strict';

ngivr.model.weighingHouse = class
{
  constructor()
  {
    this.name = undefined;
    this.site = undefined;
    this.prefix = undefined;
    this.visible = true,

    this.arabesque = {
      tcpAddress: undefined,
      tcpPort: undefined,
      type: undefined,
    }

  }
};
