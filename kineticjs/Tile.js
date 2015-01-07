/**
 * Created by bsnyder on 12/12/14.
 */
(function() {
    Kinetic.Util.addMethods(Kinetic.Tile, {
        _____init: function(config) {
            // call super constructor
            this.drawInvisible = true;
            this.nodeType = 'Layer';
            this.className = 'Tile';
            this.zoomLevel = config.zoomLevel;
            this.address = config.address;
            this.bbox = config.bbox;

            this.baseZoom = Math.pow(2, this.zoomLevel);

            this.pointRadius = config.pointRadius / this.baseZoom;
            this.pointOpacity = config.pointOpacity;

            this.bbox.xmin -= this.pointRadius;
            this.bbox.xmax += this.pointRadius;
            this.bbox.ymin -= this.pointRadius;
            this.bbox.ymax += this.pointRadius;

            config.height = (this.bbox.ymax - this.bbox.ymin) * this.baseZoom;
            config.width = (this.bbox.xmax - this.bbox.xmin) * this.baseZoom;
            config.scale = {x: this.baseZoom, y: this.baseZoom};

            this.canvas = new Kinetic.SceneCanvas(config);
            this.hitCanvas = new Kinetic.HitCanvas();
            this.canvas._canvas.style.transformOrigin = '0px 0px 0px';
            // call super constructor
            var omit = ['zoomLevel', 'address', 'bbox', 'pointRadius', 'pointOpacity'];
            Kinetic.BaseLayer.call(this, _.omit(config, omit));
        },
        setCanvasPosition: function(pos) {
            this.canvas.x = pos.x;
            this.canvas.y = pos.y;
            this.canvas._canvas.style.left = pos.x + 'px';
            this.canvas._canvas.style.top = pos.y + 'px';
            return this;
        },
        setCanvasZoom: function(zoom) {
            this.canvas.zoom = zoom;
            this.canvas._canvas.style.transform = 'scale(' + zoom + ',' + zoom + ')';
            return this;
        },
        _validateAdd: function(child) {
            var className = child.getClassName();
            if (className !== 'Point') {
                Kinetic.Util.error('You may only add points to a tile.');
            }
        },
        mark: function(matrix) {
            var context = this.canvas.getContext()._context;
            context.save();
            context.setTransform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]);
            context.beginPath();
            context.rect(0, 0, 50, 50);
            context.fillStyle = 'yellow';
            context.fill();
            context.restore();
        },
        //drawPosition: function(can) {
        //    var canvas = can || this.getCanvas();
        //    canvas._canvas.style.left = this.getX() + PX;
        //    canvas._canvas.style.top = this.getY() + PX;
        //    //this.setSize(this.width, this.height);
        //    return this;
        //},
        //drawScene: function(can, top) {
        //    var canvas = can || this.getCanvas();
        //    this.drawPosition(canvas);
        //    Kinetic.Layer.prototype.drawScene.call(this, canvas, top);
        //    return this;
        //},
        //setPixelRatio: function(ratio) {
        //    this.canvas.setPixelRatio(ratio);
        //},
        //_drawChildren: function(canvas, drawMethod) {
        //    if (drawMethod !== "drawScene") {
        //        return Kinetic.Container.prototype._drawChildren.call(this, canvas, drawMethod);
        //    }
        //    var context = canvas.getContext()._context,
        //        radius = this.getPointRadius(),
        //        _x = 0,
        //        _y = 0,
        //        x, y;
        //
        //    context.save();
        //    context.fillStyle = this.getPointFill();
        //    context.globalAlpha = this.getPointOpacity();
        //    var nodes = this.getChildren();
        //    var numNodes = nodes.length,
        //        node;
        //    for (var i = 0; i < numNodes; i++) {
        //        node = nodes[i];
        //        x = node.x();
        //        y = node.y();
        //        context.translate(x - _x, y - _y);
        //        context.beginPath();
        //        context.arc(0, 0, radius, 0, PIx2, false);
        //        context.closePath();
        //        context.fill();
        //        _x = x;
        //        _y = y;
        //    }
        //    context.restore();
        //},
        //getX: function() { return this.bbox.xmin },
        //getY: function() { return this.bbox.ymin },
        setX: function() { Kinetic.Util.error("cannot change position of tile") },
        setY: function() { Kinetic.Util.error("cannot change position of tile") },
        setPosition: function() { Kinetic.Util.error("cannot change position of tile") },
        setAbsolutePosition: function() { Kinetic.Util.error("cannot change position of tile") }
    });
    Kinetic.Util.extend(Kinetic.Tile, Kinetic.Layer);

    Kinetic.Factory.addGetterSetter(Kinetic.Tile, 'zoom');

    //Kinetic.Factory.addGetterSetter(Kinetic.Tile, 'transformsEnabled', 'none', function(t) {
    //    if (t !== 'none')
    //        Kinetic.warn("tried to set Tile transforms to '"+t+"': reverting to 'none'");
    //    return 'none';
    //});

    Kinetic.Point = function(config) {
        this.____init(config);
    };

    Kinetic.Point.prototype = {
        ____init: function(config) {
            // call super constructor
            Kinetic.Circle.call(this, config);
            this.className = 'Point';
        },
        _validateParent: function(parent) {
            var className = parent.getClassName();
            if (className !== 'Tile') {
                Kinetic.Util.error('You may only add points to a tile.');
            }
        },
        getTile: function() {
            return this.parent;
        },
        setPosition: function(pos) {
            var tile = this.getTile();
            if (tile && tile.bbox) {
                pos = _.clone(pos);
                pos.x -= tile.bbox.xmin;
                pos.y -= tile.bbox.ymin;
            }
            Kinetic.Node.prototype.setPosition.call(this, pos);
        },
        getPosition: function() {
            var pos = Kinetic.Node.prototype.getPosition.call(this);
            var tile = this.getTile();
            if (tile && tile.bbox) {
                pos.x += tile.bbox.xmin;
                pos.y += tile.bbox.ymin;
            }
            return pos;
        },
        setAbsolutePosition: function(pos) {
            var tile = this.getTile();
            if (tile && tile.bbox) {
                pos = _.clone(pos);
                pos.x -= tile.bbox.xmin;
                pos.y -= tile.bbox.ymin;
            }
            Kinetic.Node.prototype.setAbsolutePosition.call(this, pos);
        },
        getAbsolutePosition: function() {
            var pos = Kinetic.Node.prototype.getAbsolutePosition.call(this);
            var tile = this.getTile();
            if (tile && tile.bbox) {
                pos.x += tile.bbox.xmin;
                pos.y += tile.bbox.ymin;
            }
            return pos;
        },
        getRadius: function() {
            return this.getTile().pointRadius;
        },
        setRadius: function() {
            Kinetic.Util.error("cannot directly set radius of point");
        },
        getOpacity: function() {
            return this.getTile().pointOpacity;
        },
        setOpacity: function() {
            Kinetic.Util.error("cannot directly set opacity of point");
        },
        getAbsoluteOpacity: Kinetic.Node.prototype._getAbsoluteOpacity // don't use cache
    };
    Kinetic.Util.extend(Kinetic.Point, Kinetic.Circle);

    Kinetic.Factory.addGetterSetter(Kinetic.Point, 'pointId');
    Kinetic.Factory.addComponentsGetterSetter(Kinetic.Point, 'coord', ['x', 'y']);
    Kinetic.Factory.addGetterSetter(Kinetic.Point, 'coordX');
    Kinetic.Factory.addGetterSetter(Kinetic.Point, 'coordY');


    })();
