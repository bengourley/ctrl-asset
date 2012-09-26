module('FileUploadView', function (module) {

  var notification = require('notification');

  var FileUploadView = Backbone.View.extend({

    initialize: function () {

      var progress = $('.asset-progress-indicator');

      $('#fileupload')
        .fileupload({
          url: '/admin/asset/api'
        })
        .bind('submit', function (e) {
          e.preventDefault();
          $(this).find('input[type=file]').click();
        })
        .bind('fileuploadstart', function (e) {
          progress.css({
            display: 'block',
            width: '0%'
          })
        })
        .bind('fileuploadprogressall', function (e, data) {
          progress.css({
            width: data.loaded / data.total + '%'
          });
        })
        .bind('fileuploadfail', function (e, data) {
          notification
            .error('Asset upload failed')
            .effect('slide');
          progress.css({ display: 'none' });
        })
        .bind('fileuploaddone', _.bind(function (e, data) {
          progress.css({ display: 'none' });
          if (Array.isArray(data.result) && data.result.length > 0) {
            _.each(data.result, function (result) {
              this.model.trigger('addAsset', result);
            }, this);
          } else {
            notification
              .error('Asset upload failed')
              .effect('slide');
          }
        }, this));
    }

  });

  module.exports = FileUploadView;

});