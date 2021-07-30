const templateInstanceActionGenerator = (action) => {
  return (request, response) => {

    try {
      global.ngivr.queue('template-instance').add({
        type: action,
        body: request.body.response,
        params: request.params,
        requestId: request.body.requestId
      });

      response.send({
        response: 'ok'
      })

    } catch(err) {
      console.error(err);
      request.app.locals.errorHandler(response, err);
    }
  }

}


const generater = (router) => {

  const actions = [
    'increment',
    'decrease',
    'get',
  ]

  actions.forEach(action => {
    router.post(`/template-instance/${action}/:template/:id`, templateInstanceActionGenerator(action));
  })

}

module.exports.generater = generater
