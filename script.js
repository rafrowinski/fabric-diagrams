( function() {
    var canvas = this.__canvas = new fabric.Canvas( 'c', {
        selection: false
    } );
    fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';

    var lineStyle = {
        fill: 'black',
        stroke: 'black',
        strokeWidth: 4,
        selectable: false
    };

    function createCircle( id, left, top, lineToList, lineFromList ) {
        var circle = new fabric.Circle( {
            left: left,
            top: top,
            strokeWidth: 5,
            radius: 20,
            fill: '#fff',
            stroke: '#666'
        } );

        //TODO do wyeksportowania?
        circle.hasControls = false;
        circle.hasBorders = false;
        circle.lineToList = lineToList ? lineToList : [];
        circle.lineFromList = lineFromList ? lineFromList : [];
        circle.id = id;

        return circle;
    }

    function createImage( id, imageUrl, x, y, lineToList, lineFromList ) {
        var imagePromise = new $.Deferred()
        fabric.Image.fromURL( imageUrl, function( oImg ) {
            oImg.hasControls = false;
            oImg.hasBorders = false;
            oImg.lineToList = lineToList ? lineToList : [];
            oImg.lineFromList = lineFromList ? lineFromList : [];
            oImg.id = id;
            imagePromise.resolve( oImg );
        }, {
            left: x,
            top: y
        } );

        return imagePromise;
    }

    function makeLine( coords ) {
        return new fabric.Line( coords, lineStyle );
    }

    function drawAllLines( objectMap, canvas ) {
        for ( var key in objectMap ) {
            if ( objectMap.hasOwnProperty( key ) ) {
                var value = objectMap[ key ];
                var toList = value.lineToList
                for ( var index in toList ) {
                    var x1 = value.left;
                    var y1 = value.top;
                    var destDTO = toList[ index ];
                    var toObject = objectMap[ destDTO.id ];
                    var x2 = toObject.left;
                    var y2 = toObject.top;
                    var line = makeLine( [ x1, y1, x2, y2 ] );
                    destDTO.line = line;
                    canvas.add( line );
                }
            }
        }

    }

    function drawObjectMap( objectMap, canvas ) {
        var list = Object.keys( objectMap )
            .map( function( key ) {
                return objectMap[ key ];
            } );
        canvas.add.apply( this.__canvas, list );
    }

    function drawObjectLines( object, objectMap, canvas ) { //TODO split -> too big
        var toList = object.lineToList;
        for ( var index in toList ) {
            var destDTO = toList[ index ];
            var objectTo = objectMap[ destDTO.id ]; //TODO null check
            destDTO.line.set( {
                'x1': object.left,
                'y1': object.top,
                'x2': objectTo.left,
                'y2': objectTo.top
            } );
        }

        var fromList = object.lineFromList;
        var ownId = object.id;
        for ( var index2 in fromList ) {
            var sourceId = fromList[ index2 ];
            var objectFrom = objectMap[ sourceId ]; //TODO null check
            var sourceDTO = objectFrom.lineToList.find( function( item ) {
                return item.id == ownId;;
            } )
            sourceDTO.line.set( {
                'x1': objectFrom.left,
                'y1': objectFrom.top,
                'x2': object.left,
                'y2': object.top
            } );
        }
    }

    function drawGrid( canvasSize, gridTileSize ) {

        for ( var i = 0; i < ( canvasSize / gridTileSize ); i++ ) {
            canvas.add( new fabric.Line( [ i * gridTileSize, 0, i * gridTileSize, canvasSize ], {
                stroke: '#ccc',
                selectable: false
            } ) );
            canvas.add( new fabric.Line( [ 0, i * gridTileSize, canvasSize, i * gridTileSize ], {
                stroke: '#ccc',
                selectable: false
            } ) )
        }
    }

    function snapToGrid( element, gridTileSize ) {
        element.set( {
            left: Math.round( element.left / gridTileSize ) * gridTileSize,
            top: Math.round( element.top / gridTileSize ) * gridTileSize
        } );
    }

    function snapAllToGrid( objectMap, gridTileSize, canvas ) {
        for ( var key in objectMap ) {
            if ( objectMap.hasOwnProperty( key ) ) {
                snapToGrid( objectMap[ key ], gridTileSize );
            }
        }
    }

    //props
    var objectMap = {};
    var gridTileSize = 200;
    var canvasHtml = $( '#c' )
        .get( 0 );
    var canvasSize = canvasHtml.height;
    var promiseList = [];

    // objectMap[ 1 ] =
    //     createCircle( 1, 200, 200, [ {
    //         id: 2
    //     }, {
    //         id: 3
    //     } ], [] );
    // objectMap[ 2 ] = createCircle( 2, 250, 400, [], [ 1 ] );
    // objectMap[ 3 ] = createCircle( 3, 400, 400, [], [ 1 ] );
    promiseList.push( createImage( 1, 'images/central_unit.png', 200, 200, [ {
        id: 2
    }, {
        id: 3
    } ], [] ) );
    promiseList.push( createImage( 2, 'images/router.png', 250, 400, [], [ 1 ] ) );
    promiseList.push( createImage( 3, 'images/thermostat.png', 400, 400, [ {
        id: 4
    } ], [ 1 ] ) );
    promiseList.push( createImage( 4, 'images/radiator.png', 600, 600, [], [ 3 ] ) );

    $.when.apply( this, promiseList )
        .then( function() {
            for ( var index in arguments ) {
                if ( arguments.hasOwnProperty( index ) ) {
                    var image = arguments[ index ];
                    objectMap[ image.id ] = image
                }
            }
            drawGrid( canvasSize, gridTileSize );
            snapAllToGrid( objectMap, gridTileSize, canvas );
            drawAllLines( objectMap, canvas );
            drawObjectMap( objectMap, canvas );
        } );





    //listeners
    canvas.on( 'object:moving', function( caller ) {
        var element = caller.target;
        snapToGrid( element, gridTileSize );
        drawObjectLines( element, objectMap, canvas );

        canvas.renderAll();
    } );
} )();
