module.exports = async (request, response) => {
  response.status(401).json({
    data: new Date(),
    status: 'error',
  });
}
