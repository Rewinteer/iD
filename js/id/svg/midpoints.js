iD.svg.Midpoints = function(projection, context) {
    return function drawMidpoints(surface, graph, entities, filter, extent) {
        var midpoints = {};

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];

            if (entity.type !== 'way')
                continue;
            if (!filter(entity))
                continue;
            if (context.selectedIDs().indexOf(entity.id) < 0)
                continue;

            var nodes = graph.childNodes(entity);
            for (var j = 0; j < nodes.length - 1; j++) {

                var a = nodes[j],
                    b = nodes[j + 1],
                    id = [a.id, b.id].sort().join('-');

                if (midpoints[id]) {
                    midpoints[id].parents.push(entity);
                } else {
                    if (iD.geo.euclideanDistance(projection(a.loc), projection(b.loc)) > 40) {
                        var point = iD.geo.interp(a.loc, b.loc, 0.5),
                            loc;

                        if (extent.intersects(point)) {
                            loc = point;
                        } else {
                            var poly = extent.polygon();
                            for (var k = 0; k < 4; k++) {
                                point = iD.geo.lineIntersection([a.loc, b.loc], [poly[k], poly[k+1]]);
                                if (point &&
                                    iD.geo.euclideanDistance(projection(a.loc), projection(point)) > 20 &&
                                    iD.geo.euclideanDistance(projection(b.loc), projection(point)) > 20)
                                {
                                    loc = point;
                                    break;
                                }
                            }
                        }

                        if (loc) {
                            midpoints[id] = {
                                type: 'midpoint',
                                id: id,
                                loc: loc,
                                edge: [a.id, b.id],
                                parents: [entity]
                            };
                        }

                    }
                }
            }
        }

        function midpointFilter(d) {
            if (midpoints[d.id])
                return true;

            for (var i = 0; i < d.parents.length; i++)
                if (filter(d.parents[i]))
                    return true;

            return false;
        }

        var groups = surface.select('.layer-hit').selectAll('g.midpoint')
            .filter(midpointFilter)
            .data(_.values(midpoints), function(d) { return d.id; });

        var group = groups.enter()
            .insert('g', ':first-child')
            .attr('class', 'midpoint');

        group.append('circle')
            .attr('r', 7)
            .attr('class', 'shadow');

        group.append('circle')
            .attr('r', 3)
            .attr('class', 'fill');

        groups.attr('transform', iD.svg.PointTransform(projection));

        // Propagate data bindings.
        groups.select('circle.shadow');
        groups.select('circle.fill');

        groups.exit()
            .remove();
    };
};
