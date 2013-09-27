
var flatten = require( 'flatten' );
var extend = require( 'extend' );
var composable = require( 'composable' );

module.exports = exports = function( options ) {
  options || ( options = {} );
  var base = options.base;
  var typeField = options.typeField || '_type';
  options.factory || ( options.factory = [] );

  // transform input options.factory list to a dictory;
  var factory = {};
  loadFactory( options.factory, base );

  var plugin = {
    instanceMembers: {
      loadFactory: loadFactory,
      register: register,
      unRegister: unRegister,

      createObject: function( json ) {
        if ( json && typeof json === 'object' ) {
          var type = getObjectType( json );
          var ctor = findConstructor( type, factory );

          if ( typeof ctor === 'function' ) {
            if ( typeof ctor.create === 'function' ) {
              return ctor.create( json );
            } else {
              return new ctor( json );
            }
          } else {
            throw new Error( '::createObject: Can not find constructor of type '
                             + type );
          }
        }

        throw new Error( '::createObject: Input must be an object '
                         + 'and has a type field.' );
      }
    },

    classMembers: {}
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
    addToFactory( id, ctor, factory );
    return id;
  }

  function unRegister( type ) {
    if ( typeof type === 'function' ) {
      type = type.type;
    }

    removeFromFactory( type, factory );
    return this;
  }



  function getObjectType( json ) {
    return json[ typeField ];
  }

  function findConstructor( type, factory ) {
    return factory[ type ];
  }

  function addToFactory( type, ctor, factory ) {
    factory[ type ] = ctor;
  }

  function removeFromFactory( type, factory ) {
    delete factory[ type ];
  }
}
