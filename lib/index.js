
// var flatten = require( 'flatten' );
var extend = require( 'extend' );
var composable = require( 'composable' );

module.exports = exports = function( options ) {
  options || ( options = {} );
  var base = options.base;
  var typeField = options.typeField || '_type';
  var sep = options.typeStringSeperator || '.';
  options.factory || ( options.factory = [] );

  // transform input options.factory list to a dictory;
  var factory = {};
  loadFactory( options.factory, base );

  var plugin = {
    instanceMembers: {
      loadFactory: loadFactory,
      clearFactory: clearFactory,
      register: register,
      unRegister: unRegister,
      findConstructor: findConstructor,
      createObject: createObject,
      getAvailableClasses: getAvailableClasses
    },

    classMembers: {
      loadFactory: loadFactory,
      clearFactory: clearFactory,
      register: register,
      unRegister: unRegister,
      findConstructor: findConstructor,
      createObject: createObject,
      getAvailableClasses: getAvailableClasses
    }
  };

  plugin.standalone = composable( plugin );
  plugin.composable = composable().use( plugin ).getComposed();
  return plugin;

  function loadFactory( models, base ) {
    if ( !Array.isArray( models ) ) {
      return extend( factory, models );
    }

    models
      .map( function( c ) {
        if ( Array.isArray( c ) || typeof c === 'function' ) {
          return c;
        } else if ( typeof c === 'object' ) {
          return composable( base ).use( c ).getComposed();
        } else {
          return null;
        }
      } )
      .filter( function( c ) {
        return c !== null;
      } )
      .map( function( c ) {
        if ( !Array.isArray( c ) ) {
          return [ c ];
        }
        return c;
      } )
      .forEach( function( item ) {
        register.apply( null, item );
      } );

    return factory;
  }

  function clearFactory() {
    factory = {};
    return factory;
  }

  function createObject( json ) {
    if ( json && typeof json === 'object' ) {
      var type = getObjectType( json );
      var ctor = findConstructor( type );
      var args = reject( json, typeField );

      if ( typeof ctor === 'function' ) {
        if ( typeof ctor.create === 'function' ) {
          return ctor.create( args );
        } else {
          return new ctor( args );
        }
      } else {
        throw new Error( '::createObject: Can not find constructor of type '
                         + type );
      }
    }

    throw new Error( '::createObject: Input must be an object '
                     + 'and has a type field.' );
  }

  function register( type, ctor ) {
    var id;
    if ( arguments.length === 2 ) {
      id = type;
    } else {
      ctor = type;
      if ( ctor.type ) {
        id = ctor.type;
      } else if ( ctor.name ) {
        id = ctor.name;
      } else {
        id = 'Model_' + Date.now();
      }
    }
    addToFactory( id, ctor );
    return id;
  }

  function unRegister( type ) {
    if ( typeof type === 'function' ) {
      type = type.type;
    }

    removeFromFactory( type );
    return this;
  }

  function getAvailableClasses( prefix ) {
    var out = [];
    prefix || ( prefix = '' );

    Object
      .keys( factory )
      .map( function( k ) {
        return [ prefix + k, factory[ k ] ];
      } )
      .forEach( function( el ) {
        out.push( el[0] );
        if ( typeof el[1].getAvailableClasses === 'function' ) {
          out = out.concat( el[1].getAvailableClasses( el[0] + sep ) );
        }
      } );
    return out;
  }

  function getObjectType( json ) {
    return json[ typeField ];
  }

  function findConstructor( type ) {
    var list = type.split( sep );
    var thisLevel = list.shift();
    var nextLevel = list.join( sep );
    var ctor = factory[ thisLevel ];

    if ( nextLevel !== '' ) {
      if ( typeof ctor.findConstructor === 'function' ) {
        return ctor.findConstructor( nextLevel );
      } else {
        return null;
      }
    } else {
      return ctor;
    }
  }

  function addToFactory( type, ctor ) {
    factory[ type ] = ctor;
  }

  function removeFromFactory( type ) {
    delete factory[ type ];
  }
}

function reject( obj, keys ) {
  Array.isArray( keys ) || ( keys = [ keys ] );
  var mask = keys
    .reduce( function( obj, item ) {
      obj[ item ] = true;
      return obj;
    }, {} );

  return Object
    .keys( obj )
    .filter( function( k ) {
      return !mask[k];
    } )
    .reduce( function( ret, key ) {
      ret[ key ] = obj[ key ];
      return ret;
    }, {} );
}
