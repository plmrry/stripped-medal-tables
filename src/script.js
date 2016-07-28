'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

// jshint esversion: 6, unused: true, undef: true
/* global require, console, window */ // jshint ignore:line

require(['_nytg/NYTG_SLUG/assets', '_nytg/NYTG_SLUG/big-assets', 'jquery/nyt', 'underscore/1.6', 'foundation/views/page-manager', 'nyt5/analytics', 'lib/text-balancer', // uncomment to balance headlines
'node_modules/d3/build/d3',
// 'node_modules/d3-jetpack/d3-jetpack',
'_nytg/data', 'node_modules/rx/dist/rx.all'
// 'queue/1'
// 'resizerScript'     // uncomment this line to include resizerScript
// 'templates'         // uncomment to use src/templates
], function (NYTG_ASSETS, NYTG_BIG_ASSETS, $, _, PageManager, Analytics, balanceText, d3, data, Rx) {
  // jshint ignore:line
  // version_1(d3, $)(data);
  // require(['node_modules/d3-jetpack/d3-jetpack'], function(_d3) { debugger });
  version_2(d3, $, Rx, _)(d3.select('#g-graphic'), data.rows_v2);
  // console.log(data.rows_v2);
}); // end require

function version_2(d3, $, Rx, _) {
  var stream = Rx.Observable;
  return function (container, data) {
    var margin = { top: 20, right: 40, bottom: 30, left: 40 };
    var height = 400;

    data.sort(function (a, b) {
      return d3.ascending(parseInt(a.oly_year), parseInt(b.oly_year));
    });
    data.shift();
    data.forEach(function (d, i) {
      return d.id = i;
    });
    var years = data.map(function (d) {
      return parseInt(d.oly_year);
    }).concat(data.map(function (d) {
      return new Date(d.decision_date).getFullYear();
    }));
    var year_extent = d3.extent(years);
    var x_domain = [new Date(year_extent[0], 0, 1), new Date(year_extent[1] + 1, 0, 1)];

    var root = get_hierarchy(data);

    d3.cluster().size([height, 0])(root);

    var leaves = root.leaves();

    var y_cluster = d3.scaleOrdinal().domain(leaves.map(function (d, i) {
      return i;
    })).range(leaves.map(function (d) {
      return d.x;
    }));

    function get_hierarchy(data) {
      // data = _.sortBy(data, d => d.medal === 'g' ? 2 : d.medal === 's' ? 1 : 0);
      var nested = d3.nest().key(function () {
        return "_root";
      }).key(function (d) {
        return d.ath_first_name + '-' + d.ath_last_name + '-' + d.oly_year;
      }).entries(data);
      var tree = d3.hierarchy(nested[0], function (d) {
        return d.values;
      });
      return tree;
    }

    var x = d3.scaleTime().domain(x_domain);

    var x_axis = d3.axisBottom(x).tickSize(-height).tickSizeOuter(0);

    // const y = d3.scalePoint()
    //   .domain(data.map(d => d.id))
    //   .range([0, height])
    //   .padding(0.5);

    var svg = container.append('svg').attr('id', 'g-oly-1').classed('oly-chart', true).attr('height', height + margin.top + margin.bottom);
    // .style('border', '1px solid #ddd');

    var frame = svg.append('g').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

    frame.append('g').classed('axis axis--x', true).attr('transform', 'translate(0, ' + height + ')');

    var rows_join = frame.selectAll('g.row').data(data);

    var rows = rows_join.enter().append('g').classed('row', true).each(function () {
      d3.select(this).append('g').classed('line', true).append('line').style('stroke', '#555');
    }).merge(rows_join).attr('transform', function (d, i) {
      return 'translate(0, ' + y_cluster(i) + ')';
    });

    var MONTH = 8 - 1; // August
    var DAY = 12;

    function getPoints(datum) {
      return [{
        type: 'awarded',
        datum: datum,
        parsed_date: new Date(parseInt(datum.oly_year), MONTH, DAY)
      }, {
        type: 'stripped',
        datum: datum,
        parsed_date: new Date(datum.decision_date)
      }];
    }

    var medal_color = d3.scaleOrdinal().domain(['g', 's', 'b']).range(['gold', 'silver', '#C9AE5D']);

    var points_join = rows.selectAll('g.point').data(getPoints);

    var RADIUS = 4;

    var points = points_join.enter().append('g').classed('point', true).each(function (d) {
      if (d.type === 'awarded') {
        d3.select(this).append('circle').attr('r', RADIUS).style('fill', function (d) {
          return medal_color(d.datum.medal);
        });
        // d3.select(this).append('text')
        //   .style('font-family', 'nyt-franklin')
        //   .style('font-size', '0.7rem')
        //   .style('fill', '#555')
        //   .attr('dy', '-0.2rem')
        //   .attr('dx', '0.3rem')
        //   .text(({ datum }) => `${datum.ath_first_name} ${datum.ath_last_name}`.toUpperCase());
      }
    }).merge(points_join);

    // debugger
    var labels_join = frame.selectAll('g.label').data(root.children);

    var labels = labels_join.enter().append('g').classed('label', true).append('text').style('font-family', 'nyt-franklin').style('font-size', '0.7rem').style('fill', '#555').attr('dy', '-0.2rem').attr('dx', '0.3rem').text(function (d) {
      var o = d.children[0].data;
      return (o.ath_first_name + ' ' + o.ath_last_name).toUpperCase();
    }).merge(labels_join);

    var width$ = stream.fromEvent(window, 'resize').startWith(window).map(function () {
      return $(svg.node().parentNode).innerWidth();
    });

    width$.subscribe(function (chartWidth) {
      console.log(chartWidth);
      x_axis.ticks(d3.timeYear.every(2));
      var width = chartWidth - margin.left - margin.right;
      x.range([0, width]);
      container.selectAll('.oly-chart').attr('width', chartWidth).select('.axis--x').call(x_axis).each(function () {
        d3.select(this).selectAll('line').style('stroke', '#ddd');
        d3.select(this).selectAll('text').style('font-family', '"nyt-franklin"');
      });
      points.attr('transform', function (d) {
        var circle = d3.select(this).select('circle');
        var radius = circle.size() ? parseFloat(circle.attr('r')) : 0;
        var offset = radius + 1;
        return 'translate(' + (x(d.parsed_date) - offset) + ', 0)';
      });
      labels.attr('transform', function (parent) {
        var _parent$children = _slicedToArray(parent.children, 1);

        var data = _parent$children[0].data;

        var parsed_date = getPoints(data)[0].parsed_date;
        return 'translate(' + x(parsed_date) + ', ' + y_cluster(data.id) + ')';
      });
      rows.select('line').datum(function (d) {
        return getPoints(d).map(function (d) {
          return d.parsed_date;
        });
      }).attr('x1', function (d) {
        return x(d[0]);
      }).attr('x2', function (d) {
        return x(d[1]);
      });
    });
  };
}

function version_1(d3, $) {
  // jshint ignore:line
  return function (data) {
    var margin = { top: 20, right: 20, bottom: 30, left: 40 };
    var height = 200;

    var svg = d3.select('#g-graphic').append('svg').attr('id', 'g-oly-1').classed('oly-chart', true).attr('height', height + margin.top + margin.bottom).style('border', '1px solid red');

    var frame = svg.append('g').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

    var cluster = d3.cluster();

    var x = d3.scaleTime().domain([new Date(2004, 0, 0), new Date(2015, 0, 0)]);

    var root = get_hierarchy(data.rows);

    cluster.size([height, 0])(root);
    var leaves = root.leaves();

    var y = d3.scaleOrdinal().domain(leaves.map(function (d) {
      return d.data.value;
    })).range(leaves.map(function (d) {
      return d.x;
    }));

    var medal_color = d3.scaleOrdinal().domain(['g', 's', 'b']).range(['gold', 'silver', '#C9AE5D']);

    frame.selectAll('.point').data(data.rows).enter().append('g').classed('point', true).each(function () {
      // d3.select(this).append('text').text(d => d.medal)
    }).append('circle').attr('r', 3)
    // .style('fill', d => medal_color(d.medal));
    .style('fill', function (d) {
      return ['g', 's', 'b'].indexOf(d.medal) !== -1 ? medal_color(d.medal) : 'red';
    }); // medal_color(d.medal));
    // .style('fill', d => { medal_color; debugger })

    resizeAll();

    function resizeAll() {
      d3.selectAll('.oly-chart').attr('width', function () {
        return $(this.parentNode).innerWidth();
      });
      var newWidth = svg.node().parentNode.clientWidth - margin.left - margin.right;
      x.rangeRound([0, newWidth]);
      frame.selectAll('.point').attr('transform', function (_ref) {
        var year = _ref.year;
        var month = _ref.month;
        var day = _ref.day;
        var full_name = _ref.full_name;

        var date = new Date(year, parseInt(month) - 1, day);
        return 'translate(' + x(date) + ', ' + y(full_name) + ')';
      });
    }

    d3.select(window).on('resize', resizeAll);

    function get_hierarchy(data) {
      var nested = d3.nest().key(function () {
        return "_root";
      }).key(function (d) {
        return d.id;
      }).key(function (d) {
        return d.athlete_order;
      }).rollup(function (d) {
        return d[0].full_name;
      }).entries(data);
      var tree = d3.hierarchy(nested[0], function (d) {
        return d.values;
      });
      return tree;
    }
  };
}
