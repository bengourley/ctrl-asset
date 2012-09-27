var save = require('save')
  , saveMongodb = require('save-mongodb')

// Export bundle meta-data and
// initializations functions.
module.exports =

  // Meta
  { name: 'Asset Library'
  , version: '0.0.1'
  , description: 'Upload and manage assets'

  // Serve /public directory at /asset-static
  , publicRoute: '/asset-static'

  // Add asset link to the admin nav
  , adminNav:
    [{ label: 'Asset'
     , url: '/admin/asset'
     , section: 'asset'
     , permission:
       { resource: 'Asset'
       , action: 'read'
       }
    }]

  // Ordered initialization functions
  , initialize:
    [ function (sl, done) {

        // Create persistence mechanism

        var db = sl.databaseConnections.main

        db.collection('asset', function(error, collection) {
          sl.saveFactory.asset = function () {
            return save('asset', { logger: sl.logger,
              engine: saveMongodb(collection)})
          }
          done()
        });

      }
    , function (sl, done) {

        // Register the model
        sl.register('assetModel', require('./model')(sl))

        // Add resource to the ACL
        sl.adminAccessControlList.addResource('Asset')

        // Create front- and back-end controllers
        require('./controller')(sl, __dirname + '/views')
        require('./adminController')(sl, __dirname + '/views')

        done()

      }
    , function (sl, done) {

        // Recompile the stylus file when it changes
        sl.stylusWatch(
          __dirname + '/public/css/asset.styl',
          { compile: sl.stylusCompile }
        )
        done()

      }
    ]

}