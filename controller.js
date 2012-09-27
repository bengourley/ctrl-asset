module.exports = createRoutes

var thumbnail = require('./thumbnail')

// MaxAge sum from connect static middleware
var maxAge = 60 * 60 * 24 * 365 * 1000

// Create the routes that facilitate
// unauthenticated retrieval of assets
function createRoutes(serviceLocator, viewPath) {

  var assetModel = serviceLocator.assetModel

  var thumb = thumbnail(serviceLocator.properties)

  function findAsset(req, res, next) {
    assetModel.read(req.params.id, function (err, result) {
      if (err) {
        next(err)
      } else if (!result) {
        next(new serviceLocator.httpErrorHandler.NotFound())
      } else {
        serviceLocator.uploadDelegate.get(result, function(err, data) {
          if (err) {
            next(err)
          } else {
            res.asset = { meta: result, data: data }
            next()
          }
        })
      }
    })
  }

  // Get the original asset
  serviceLocator.router.get(
    '/asset/:id/:name',
    findAsset,
    function (req, res, next) {

      var asset = res.asset
      res.header('Content-Type', asset.meta.type)
      res.header('Date', new Date().toUTCString())
      res.header('Cache-Control', 'public, max-age=' + (maxAge / 1000))
      res.header('Content-Length', asset.meta.size)
      // TODO also fs.stat header
      res.end(asset.data)

    }
  )

  // Create a thumbnail if
  // the asset is an image
  serviceLocator.router.get(
    '/asset/thumb/:id/:name',
    findAsset,
    function (req, res, next) {

      if (!/^image\//.test(res.asset.meta.type)) {
        return next(new Error('Can only generate a thumbnail for image assets'))
      }

      thumb(res.asset.meta, function (err, imageStream) {
        if (err) {
          next(err)
        } else {
          res.header('Content-Type', res.asset.meta.type)
          res.header('Date', new Date().toUTCString())
          res.header('Cache-Control', 'public, max-age=' + (maxAge / 1000))
          imageStream.pipe(res)
        }
      })

    }
  )

}