var save = require('save')
  , saveMongodb = require('save-mongodb')
  ;

module.exports = {
  name: 'Asset Library',
  version: '0.0.1',
  description: 'Upload and manage assets',
  publicRoute: '/asset-static',
  adminNav: [{
    label: 'Asset',
    url: '/admin/asset',
    section: 'asset',
    permission: {
      resource: 'Asset',
      action: 'read'
    }
  }],
  initialize: [
    function(serviceLocator, done) {

      var db = serviceLocator.databaseConnections.main;

      db.collection('asset', function(error, collection) {
        serviceLocator.saveFactory.asset = function () {
          return save('asset', { logger: serviceLocator.logger,
            engine: saveMongodb(collection)});
        };
        done();
      });

    },
    function (serviceLocator, done) {

      serviceLocator.register('assetModel', require('./model')(serviceLocator));
      serviceLocator.adminAccessControlList.addResource('Asset');

      require('./controller')(serviceLocator, __dirname + '/views');
      require('./adminController')(serviceLocator, __dirname + '/views');

      done();

    },
    function (serviceLocator, done) {

      // This is watch recompiles your stylus. Any that you need to compile to CSS
      // need to be defined here. This is quicker than the standard middleware.
      serviceLocator.stylusWatch(__dirname + '/public/css/asset.styl',
      { compile: serviceLocator.stylusCompile });

      done();
    }
  ]
};