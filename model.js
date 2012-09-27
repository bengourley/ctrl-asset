module.exports = createModel

var validity = require('validity')
  , crudModel = require('crud-model')
  , path = require('path')
  , schema = require('./schema')

function createModel(sl) {

  // Make a crud model out of the collection
  var save = sl.saveFactory.asset()
    , model = crudModel('Asset', save, schema)

  // Augment the delete and update crud methods slightly

  var _delete = model.delete
  model.delete = function(id, cb) {
    model.read(id, function (err, result) {
      if (err || !result) return cb(err)

      _delete(id, function (err) {
        if (err) return cb(err)
        sl.uploadDelegate.delete(
          path.join(result.path, result.basename),
          cb
        )
      })
    })
  }

  var _update = model.update
  model.update = function(id, changed, cb) {
    model.read(id, function(err, data) {
      if (err) return cb(err)

      data.title = changed.title
      data.description = changed.description
      data.tags = changed.tags

      _update(data, {}, cb)
    })
  }

  // List all
  model.list = function (options, cb) {
    if (!cb && typeof options === 'function') {
      cb = options
      options = {}
    }

    model.find({}, options, function (err, results) {
      if (err) {
        cb(err)
      } else {
        cb(null, results)
      }
    })
  }

  // List only images
  model.listImages = function (options, cb) {
    if (!cb && typeof options === 'function') {
      cb = options
      options = {}
    }

    model.find({ type: /^image\// }, options, function (err, results) {
      cb(err, err ? results : results.toArray())
    })
  }

  // Add a hook to fill the entity with
  // default values before validation
  model.pre('createValidate', function(entity, callback) {
    callback(null, schema.makeDefault(entity))
  })

  return model
}
