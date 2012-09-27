// Schema for asset entities

var validity = require('validity')
  , schemata = require('schemata')

module.exports = schemata(
  { _id: { }

  , size:
    { validators:
      { all: [validity.required] }
    }

  , type:
    { validators:
      { all: [validity.required] }
    }

  , path:
    { validators:
      { all: [validity.required] }
    }

  , basename:
    { validators:
      { all: [validity.required] }
  }

  , title: { defaultValue: '' }

  , description: { defaultValue: '' }

  , tags: { defaultValue: '' }

  , created:
    { type: Date
    , defaultValue: function() { return new Date() }
    }

  })