'use strict';

// jshint esversion: 6, unused: true, undef: true
/* global require, console, window */

require(['_nytg/NYTG_SLUG/assets', '_nytg/NYTG_SLUG/big-assets', 'jquery/nyt', 'underscore/1.6', 'foundation/views/page-manager', 'nyt5/analytics', 'lib/text-balancer', // uncomment to balance headlines
'node_modules/d3/build/d3', '_nytg/data'
// 'queue/1'
// 'resizerScript'     // uncomment this line to include resizerScript
// 'templates'         // uncomment to use src/templates
], function (NYTG_ASSETS, NYTG_BIG_ASSETS, $, _, PageManager, Analytics, balanceText, d3, data) {

  var margin = { top: 20, right: 20, bottom: 30, left: 40 };
  var height = 200;
  // begin code for your graphic here:
  console.log(data);

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

  // function setPositions() {
  //
  // }
  //
  // function updateY({ width, height, y }) {
  //
  // }

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
}); // end require
