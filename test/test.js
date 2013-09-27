
var expect = require( 'expect.js' );
var composable = require( 'composable' );
var Backbone = require( 'backbone' );

describe( 'factory', function() {

  it( '#createObject', function() {
    var F1 = require( 'factory' )().standalone;
    var F2 = require( 'factory' )().composable;
    var F3 = composable()
      .use( require( 'factory' )() )
      .getComposed();

    var f1 = new F1();
    var f2 = F2.create();
    var f3 = F3.create();

    function M1( obj ) {
      this.x = obj.x, this.y = obj.y;
    }
    M1.type = 'M1';
    M1.prototype.xy = function() { return ( this.x + this.y )*1; };

    function M2( obj ) {
      this.x = obj.x, this.y = obj.y;
    }
    M2.prototype.xy = function() { return ( this.x + this.y )*2; };

    var M3 = function( obj ) {
      this.x = obj.x, this.y = obj.y;
    };
    M3.prototype.xy = function() { return ( this.x + this.y )*3; };

    var M4 = function( obj ) {
      this.x = obj.x, this.y = obj.y;
    };
    M4.prototype.xy = function() { return ( this.x + this.y )*4; };

    var M5 = function( obj ) {
      this.x = obj.x, this.y = obj.y;
    };
    M5.type = 'M5';
    M5.prototype.xy = function() { return ( this.x + this.y )*5; };

    var M6 = function M6( obj ) {
      this.x = obj.x, this.y = obj.y;
    };
    M6.prototype.xy = function() { return ( this.x + this.y )*6; };

    var M7 = Backbone.Model.extend( {
      xy: function() { return ( this.get( 'x' ) + this.get( 'y' ) )* 7; }
    }, {
      type: 'M7'
    } );

    var M8 = composable().use( {
      instanceMembers: { xy: function() { return ( this.x + this.y ) * 8; } },
      classMembers: { type: 'M8' }
    } ).getComposed();

    var factories = [ f1, f2, f3 ];

    factories.forEach( function( factory ) {
      factory.register( M1 );
      factory.register( M2 );
      factory.register( 'M3', M3 );

      factory.loadFactory( [
        [ 'M4', M4 ],
        M5,
        M6
      ] );

      factory.loadFactory( {
        'M7': M7,
        'M8': M8
      } );

      var m1 = factory.createObject( { _type: 'M1', x: 10, y: 20 } );
      var m2 = factory.createObject( { _type: 'M2', x: 10, y: 20 } );
      var m3 = factory.createObject( { _type: 'M3', x: 10, y: 20 } );
      var m4 = factory.createObject( { _type: 'M4', x: 10, y: 20 } );
      var m5 = factory.createObject( { _type: 'M5', x: 10, y: 20 } );
      var m6 = factory.createObject( { _type: 'M6', x: 10, y: 20 } );
      var m7 = factory.createObject( { _type: 'M7', x: 10, y: 20 } );
      var m8 = factory.createObject( { _type: 'M8', x: 10, y: 20 } );

      expect( m1.xy() ).to.be.eql( 30 );
      expect( m2.xy() ).to.be.eql( 60 );
      expect( m3.xy() ).to.be.eql( 90 );
      expect( m4.xy() ).to.be.eql( 120 );
      expect( m5.xy() ).to.be.eql( 150 );
      expect( m6.xy() ).to.be.eql( 180 );
      expect( m7.xy() ).to.be.eql( 210 );
      expect( m8.xy() ).to.be.eql( 240 );
    } );
  } );

} );
