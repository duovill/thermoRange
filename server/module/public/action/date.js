module.exports = async (request, response) => {
  response.status(200).json({
    data: new Date()
  });
}
