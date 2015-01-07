/**
 * Created by bsnyder on 12/11/14.
 */
/*jshint unused:false */
(function() {
    var UNDERSCORE = '_',
        DRAG_MODE = 'dragMode',
        SELECT_MODE = 'selectMode',
        MOUSE_MODES = [DRAG_MODE, SELECT_MODE],

        DOMMOUSESCROLL = 'DOMMouseScroll',
        MOUSEWHEEL = 'mousewheel',
        WHEEL = 'wheel',
        EVENTS = [DOMMOUSESCROLL, MOUSEWHEEL, WHEEL],

        // cached variables
        eventsLength = EVENTS.length,
        _rangeArray = Kinetic.Util._rangeArray,
        _logArray = Kinetic.Util._logArray,
        _getLevel = Kinetic.Util._getLevel;

    function addScatterEvent(ctx, eventName) {
        ctx.content.addEventListener(eventName, function(evt) {
            ctx[UNDERSCORE + eventName](evt);
        }, false);
    }
    Kinetic.Util.addMethods(Kinetic.Scatter, {
        ____init: function(config) {
            var conf = config || {};
            Kinetic.Stage.call(this, conf);

            var num_zooms = 6;
            var min_zoom = 1;
            var max_zoom = Math.pow(2, num_zooms-1) * min_zoom;
            this.setMinZoom(min_zoom);
            this.setMaxZoom(max_zoom);
            this.setNumZooms(num_zooms);
            this.setZoom(min_zoom);

            this.zoomInfo = {
                radii: _rangeArray(2, 1, num_zooms),
                opacities: _rangeArray(0.05, 0.6, num_zooms)
            };

            this.className = 'Scatter';
            this._bindScatterEvents();

            this.active_tiles = [];
            this.points = [];
            this.tiles = {};
            this.zoom_tiles = _.range(this.getNumZooms()).map(function() {return []});
            this.point_tree = rbush(100, ['.x()', '.y()', '.x()', '.y()']);

            this.tile_trees = _.range(this.getNumZooms()).map(function(i) {
                return rbush(1 + i * 4, ['.bbox.xmin', '.bbox.ymin', '.bbox.xmax', '.bbox.ymax']);
            });
        },
        getViewWidth: function() { return this.getWidth() / this.getZoom() },
        getViewHeight: function() { return this.getHeight() / this.getZoom() },
        getAbsolutePosition: function() { return {x: this.x(), y: this.y()} },
        setAbsolutePosition: function(pos) {
            this.x(pos.x);
            this.y(pos.y);

            var active_tiles = this.computeActiveTiles();
            var new_tiles = _.difference(active_tiles, this.active_tiles);
            var old_tiles = _.difference(this.active_tiles, active_tiles);
            //console.log("old_tiles: " + old_tiles.map(function(tile) { return tile.address}));
            //console.log("new_tiles: " + new_tiles.map(function(tile) { return tile.address}));

            old_tiles.forEach(this.removeTileCanvas, this);
            new_tiles.forEach(this.addTileCanvas, this);
            active_tiles.forEach(this.positionTileCanvas, this);

            this.active_tiles = active_tiles;

            return this;
        },
        computeActiveTiles: function() {
            var view_bbox = [
                -this.x(),
                -this.y(),
                this.getViewWidth() - this.x(),
                this.getViewHeight() - this.y()
            ];
            return this.tile_trees[this.getZoomLevel()].search(view_bbox);
        },
        // TODO: will this work when nodes are moved beyond xmax, ymax?
        mapCoordinatesToPosition: function(x, y) {
            var height = this.getHeight();
            var width = this.getWidth();
            var xmargin = width * .1;
            var ymargin = height * .1;
            var xdraw = width - (2 * xmargin);
            var ydraw = height - (2 * ymargin);
            var xratio = (x - this.xmin) / (this.xmax - this.xmin);
            var yratio = (y - this.ymin) / (this.ymax - this.ymin);
            var vx = xmargin + (xratio * xdraw);
            var vy = ymargin + (yratio * ydraw);
            return {x: vx, y: vy};
        },
        addPoint: function(xcoord, ycoord, pointId) {
            var pos = this.mapCoordinatesToPosition(xcoord, ycoord);
            var bbox = {
                xmin: 0,
                ymin: 0,
                xmax: this.getWidth(),
                ymax: this.getHeight()
            };
            var address = "", tile, point;
            //console.log();
            for (var level = 0; level < this.getNumZooms(); level++) {
                //console.log(pos);
                //console.log(bbox);
                address += Kinetic.Util._gotoQuad(bbox, pos);
                tile = this.tiles[address];
                if (!tile) {
                    tile = new Kinetic.Tile({
                        bbox: _.clone(bbox),
                        pointRadius: this.zoomInfo.radii[level],
                        pointOpacity: this.zoomInfo.opacities[level],
                        canvasId: address,
                        address: address,
                        zoomLevel: level,
                        hitGraphEnabled: false
                    });
                    this.tiles[address] = tile;
                    this.zoom_tiles[level].push(tile);
                    Kinetic.Container.prototype.add.call(this, tile);
                }
                point = new Kinetic.Point({
                    pointId: pointId,
                    coord: {x: xcoord, y: ycoord},
                    fill: 'blue',
                    visible: true
                });
                tile.add(point);
                point.setPosition(pos);
                this.points.push(point);
            }
        },
        initPoints: function(xs, ys) {
            var i, j, tiles;
            this.xmin = _.min(xs);
            this.xmax = _.max(xs);
            this.ymin = _.min(ys);
            this.ymax = _.max(ys);

            for (i = 0; i < xs.length; i++) {
                this.addPoint(xs[i], ys[i], i);
            }
            this.point_tree.load(this.points);
            for (i = 0; i < this.getNumZooms(); i++) {
                tiles = this.zoom_tiles[i];
                this.tile_trees[i].load(tiles);
                for (j = 0; j < tiles.length; j++) {
                    tiles[j].draw();
                }
            }
            this.setAbsolutePosition({x: 0, y: 0});
        },
        setMinZoom: function(min_zoom) { this.minZoom = min_zoom },
        setMaxZoom: function(max_zoom) { this.maxZoom = max_zoom },
        getMinZoom: function() { return this.minZoom },
        getMaxZoom: function() { return this.maxZoom },
        getZoom: function() { return this.zoom },
        setZoom: function(zoom) {
            var min_zoom = this.getMinZoom();
            var max_zoom = this.getMaxZoom();
            if (zoom < min_zoom) zoom = min_zoom;
            //if (zoom > max_zoom) zoom = max_zoom;
            this.zoom = zoom;
            this.zoomLevel = Math.floor(Math.log(Math.min(zoom, max_zoom)) / Math.LN2);
            this.baseZoom = Math.pow(2, this.zoomLevel);
            this.relativeZoom = zoom / this.baseZoom;
        },
        setNumZooms: function(num_zooms) { this.numZooms = num_zooms },
        getNumZooms: function() { return this.numZooms },
        getZoomLevel: function() { return this.zoomLevel },
        addTileCanvas: function(tile) {
            this.content.appendChild(tile.canvas._canvas);
        },
        positionTileCanvas: function(tile) {
            var zoom = this.getZoom();
            var canvas_pos = {
                x: (tile.bbox.xmin + this.x()) * zoom,
                y: (tile.bbox.ymin + this.y()) * zoom
            };
            tile.setCanvasPosition(canvas_pos);
            tile.setCanvasZoom(this.relativeZoom);
        },
        removeTileCanvas: function(tile) {
            this.content.removeChild(tile.canvas._canvas);
        },
        _zoom: function (evt) {
            //if (!this.isZooming) {
            //    this.isZooming = true;
            //    this.zoom_anim.start();
            //}
            var mouse = this.getPointerPosition(),
                old_pos = this.getAbsolutePosition(),
                zoom_start = 1.03,
                old_zoom = this.getZoom(),
                mouse_delta = {},
                new_pos = {},
                new_zoom;

            if (evt.deltaY < 0)
                new_zoom = old_zoom * (zoom_start);
            else if (evt.deltaY > 0)
                new_zoom = old_zoom / zoom_start;
            else {
                return this;
            }
            this.setZoom(new_zoom);
            new_zoom = this.getZoom();
            mouse_delta.view_x = mouse.view_x * (old_zoom / new_zoom) - mouse.view_x;
            mouse_delta.view_y = mouse.view_y * (old_zoom / new_zoom) - mouse.view_y;
            new_pos.x = old_pos.x + mouse_delta.view_x / new_zoom;
            new_pos.y = old_pos.y + mouse_delta.view_y / new_zoom;

            this.setAbsolutePosition(new_pos);
            //this.active_tiles.forEach(function(tile) {
            //    tile.batchDraw();
            //});
            //this.active_tiles.forEach(Kinetic.BaseLayer.prototype.batchDraw.call);
            //this.batchDraw();
            //this.drawPosition();
            //this.zoom_anim.dirty = true;
            //var level = _getLevel(this.zooms, this.getZoom());
            //this.active_tiles.forEach(function (tile) {
            //    tile.setZoomLevel(level);
            //});
                    //this._tryEndZoom();
            return this;
        },
        _bindScatterEvents: function () {
            for (var n = 0; n < eventsLength; n++) {
                addScatterEvent(this, EVENTS[n]);
            }
        },
        _DOMMouseScroll: function (evt) {
            this._mousewheel(evt);
        },
        _mousewheel: function (evt) {
            evt.preventDefault();
            this._zoom(evt);
        },

        _wheel: function (evt) {
            this._mousewheel(evt);
        },
        setX: function(x) { this.attrs.x = x; return this },
        setY: function(y) { this.attrs.y = y; return this }
    });
    Kinetic.Util.extend(Kinetic.Scatter, Kinetic.Stage);

})();
