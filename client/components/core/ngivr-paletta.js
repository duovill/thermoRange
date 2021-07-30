ngivr.paletta = new function() {

  const base = {
    'contrastDefaultColor': 'light',
    'contrastDarkColors': ['50', '100',
      '200', '300', '400', 'A100'],
    'contrastLightColors': undefined
  }

  this.generate = function(color, update = 1) {
    const defaultTinyColor = tinycolor(color);

    const paletta = {
      50: defaultTinyColor.lighten(update * 5).toString('hex6'),
      100: defaultTinyColor.lighten(update * 4).toString('hex6'),
      200: defaultTinyColor.lighten(update * 3).toString('hex6'),
      300: defaultTinyColor.lighten(update * 2).toString('hex6'),
      400: defaultTinyColor.lighten(update).toString('hex6'),
      500: color,
      600: defaultTinyColor.darken(update).toString('hex6'),
      700: defaultTinyColor.darken(update * 2).toString('hex6'),
      800: defaultTinyColor.darken(update* 3).toString('hex6'),
      900: defaultTinyColor.darken(update * 4).toString('hex6'),
      'A100': defaultTinyColor.brighten(update).toString('hex6'),
      'A200': defaultTinyColor.brighten(update * 2).toString('hex6'),
      'A400': defaultTinyColor.brighten(update * 3).toString('hex6'),
      'A700': defaultTinyColor.brighten(update * 4).toString('hex6'),
    };

    const result = Object.assign(paletta, base);
//    console.log(result);
    return result;
  }
}
