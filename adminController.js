module.exports = createRoutes

// Create the routes that facilitate
// the CRUD functionality of the asset.
function createRoutes(sl, viewPath) {

  var viewRender = sl.viewRender(viewPath)
    , compact = sl.compact
    , pagination = require('../../bundles/admin/lib/pagination')(
        sl.assetModel.count, 3
      )


  // Create a compact namespace and add all
  // of the required frontend js files
  compact.addNamespace('admin-asset', __dirname + '/public')
    .addJs('js/deps/underscore.js')
    .addJs('js/deps/backbone.js')
    .addJs('js/deps/backbone.paginator.js')
    .addJs('js/deps/jquery.iframe-transport.js')
    .addJs('js/deps/jquery.fileupload.js')
    .addJs('js/models/AssetManagerModel.js')
    .addJs('js/models/AssetItemModel.js')
    .addJs('js/collections/AssetItemCollection.js')
    .addJs('js/collections/PaginatedCollection.js')
    .addJs('js/views/AssetManagerView.js')
    .addJs('js/views/FileUploadView.js')
    .addJs('js/views/AssetItemView.js')
    .addJs('js/views/AssetItemDetailsView.js')
    .addJs('js/views/PaginationView.js')
    .addJs('js/notification.js')
    .addJs('js/assetManager.js')

  // Different namespace for asset browser overlay,
  // which can be included anywhere
  compact.addNamespace('admin-asset-browser', __dirname + '/public')
    .addJs('js/assetBrowser.js')

  // Create access check middleware
  // for a given action
  function assetAccess(action) {
    return sl.adminAccessControl
      .requiredAccess('Asset', action, '/admin/login')
  }

  // Admin API routes

  // List
  sl.router.get(
    '/admin/asset/api',
    assetAccess('read'),
    function (req, res) {

      var list = req.query.type === 'image'
        ? sl.assetModel.listImages
        : sl.assetModel.list

      if (req.query.paginate) {

        pagination(req, res, function () {

          list(req.searchOptions, function (err, results) {
            if (!err) {
              res.json(
                { pagination: res.locals.pagination
                , results: results
                })
            } else {
              res.status(500).end('Format not supported')
            }
          })

        })

      } else {

        list(function (err, results) {
          if (!err) {
            if (!req.query.format) {
              res.json(results)
            } else if (req.query.format === 'redactor') {
              var redactorResponse = []
              results.forEach(function (result) {
                redactorResponse.push(
                  { thumb: '/asset/thumb/' + result._id + '/' + result.basename
                  , image: '/asset/' + result._id + '/' + result.basename
                  })
              })
              res.json(redactorResponse)
            }
          } else {
            res.status(500).end('Format not supported')
          }
        })
      }
    }
  )

  // Upload
  sl.router.post(
    '/admin/asset/api',
    assetAccess('create'),
    sl.uploadDelegate.middleware,
    function (req, res) {

      var fileField

      ;['file', 'files'].some(function (field) {
        if (req.body[field]) {
          fileField = field
          return true
        } else {
          return false
        }
      })

      // We can accept multiple files, but
      // redactor can only send one
      var response = req.query.format === 'redactor' ? {} : []
        , countdown = req.body[fileField].length

      // No files were found
      if (countdown === 0) {
        return res.json(response)
      }

      req.body[fileField].forEach(function (file) {

        sl.assetModel.create(file, {}, function (err, result) {
          if (req.query.format === 'redactor') {
            response.filelink = '/asset/' + result._id + '/' + result.basename
          } else {
            response.push(result)
          }
          countdown--
          if (countdown === 0) {

            if (req.query.format === 'redactor') {

              // Even though json is being sent,
              // the redactor plugin fails unless
              // the content type is set to text/html

              res.header('Content-Type', 'text/html')
              res.end(JSON.stringify(response))

            } else {
              res.json(response)
            }
          }
        })

      })

    }
  )

  // Get a single asset by id
  sl.router.get(
    '/admin/asset/api/:id',
    sl.adminAccessControl.requiredAccess('Asset', 'read'),
    function(req, res) {
      sl.assetModel.read(req.params.id, function(err, file) {
        if (err) {
          res.status(500)
          res.end(JSON.stringify({ error: err }))
        } else {
          res.end(JSON.stringify(file))
        }
      })
    }
  )

  // Delete a single asset by id
  sl.router.delete(
    '/admin/asset/api/:id',
    sl.adminAccessControl.requiredAccess('Asset', 'delete'),
    function (req, res) {

      var id = req.params.id
      sl.assetModel.delete(id, function (err) {
        res.json({ success: !err })
      })

    }
  )

  // Update asset details by id
  sl.router.put(
    '/admin/asset/api/:id',
    sl.adminAccessControl.requiredAccess('Asset', 'update'),
    function (req, res) {

      var id = req.params.id
      sl.assetModel.update(id, req.body, function (err) {
        res.json({ success: !err })
      })

    }
  )

  // Admin route
  // Single page app - logic is in the frontend JS
  sl.router.get(
    '/admin/asset*',
    assetAccess('read'),
    compact.js(['global'], ['admin'], ['admin-asset']),
    function (req, res) {
      viewRender(req, res, 'assetAdmin', {
        page: {
          title: 'Asset Manager',
          section: 'asset'
        }
      })
    }
  )

}