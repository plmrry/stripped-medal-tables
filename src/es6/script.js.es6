// jshint esversion: 6, unused: true, undef: true
/* global require, console, window */ // jshint ignore:line

require([
  '_nytg/NYTG_SLUG/assets',
  '_nytg/NYTG_SLUG/big-assets',
  'jquery/nyt',
  'underscore/1.6',
  'foundation/views/page-manager',
  'nyt5/analytics',
  'lib/text-balancer', // uncomment to balance headlines
  'node_modules/d3/build/d3',
  // 'node_modules/d3-jetpack/d3-jetpack',
  '_nytg/data',
  'node_modules/rx/dist/rx.all'
  // 'queue/1'
  // 'resizerScript'     // uncomment this line to include resizerScript
  // 'templates'         // uncomment to use src/templates
], function(NYTG_ASSETS, NYTG_BIG_ASSETS, $, _, PageManager, Analytics, balanceText, d3, data, Rx) { // jshint ignore:line
  // version_1(d3, $)(data);
  // require(['node_modules/d3-jetpack/d3-jetpack'], function(_d3) { debugger });
  version_2(d3, $, Rx, _)(d3.select('#g-graphic'), data.rows_v2);
  // console.log(data.rows_v2);
}); // end require

function version_2(d3, $, Rx, _) {
  const stream = Rx.Observable;
  return function(container, data) {
    const margin = {top: 20, right: 40, bottom: 30, left: 40};
    const height = 400;

    data.sort((a,b) => d3.ascending(parseInt(a.oly_year), parseInt(b.oly_year)));
    data.shift();
    data.forEach((d, i) => d.id = i);
    const years = data.map(d => parseInt(d.oly_year))
      .concat(data.map(d => (new Date(d.decision_date).getFullYear())));
    const year_extent = d3.extent(years);
    const x_domain = [new Date(year_extent[0], 0, 1), new Date(year_extent[1] + 1, 0, 1)];

    const root = get_hierarchy(data);

    d3.cluster().size([ height, 0 ])(root);

    const leaves = root.leaves();

    const y_cluster = d3.scaleOrdinal()
      .domain(leaves.map((d, i) => i))
      .range(leaves.map(d => d.x));

    function get_hierarchy(data) {
      // data = _.sortBy(data, d => d.medal === 'g' ? 2 : d.medal === 's' ? 1 : 0);
      const nested = d3.nest()
        .key(() => "_root")
        .key(d => `${d.ath_first_name}-${d.ath_last_name}-${d.oly_year}`)
        .entries(data);
      const tree = d3.hierarchy(nested[0], d => d.values);
      return tree;
    }

    const x = d3.scaleTime()
      .domain(x_domain);

    const x_axis = d3.axisBottom(x)
      .tickSize(-height)
      .tickSizeOuter(0);

    // const y = d3.scalePoint()
    //   .domain(data.map(d => d.id))
    //   .range([0, height])
    //   .padding(0.5);

    const svg = container
      .append('svg')
      .attr('id', 'g-oly-1')
      .classed('oly-chart', true)
      .attr('height', height + margin.top + margin.bottom);
      // .style('border', '1px solid #ddd');

    const frame = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    frame.append('g')
      .classed('axis axis--x', true)
      .attr('transform', `translate(0, ${height})`);

    const rows_join = frame.selectAll('g.row')
      .data(data);

    const rows = rows_join.enter()
      .append('g')
      .classed('row', true)
      .each(function() {
        d3.select(this)
          .append('g').classed('line', true)
          .append('line')
          .style('stroke', '#555');
      })
      .merge(rows_join)
      .attr('transform', (d, i) => `translate(0, ${y_cluster(i)})`);

    const MONTH = 8 - 1; // August
    const DAY = 1;

    function getPoints(datum) {
      return [
        {
          type: 'awarded',
          datum,
          parsed_date: new Date(parseInt(datum.oly_year), MONTH, DAY)
        },
        {
          type: 'stripped',
          datum,
          parsed_date: new Date(datum.decision_date)
        }
      ];
    }

    const medal_color = d3.scaleOrdinal()
      .domain(['g','s','b'])
      .range(['gold', 'silver', '#C9AE5D']);

    const points_join = rows.selectAll('g.point')
      .data(getPoints);

    const RADIUS = 4;

    const points = points_join.enter()
      .append('g')
      .classed('point', true)
      .each(function(d) {
        if (d.type === 'awarded') {
          d3.select(this).append('circle')
            .attr('r', RADIUS)
            .style('fill', d => medal_color(d.datum.medal));
          // d3.select(this).append('text')
          //   .style('font-family', 'nyt-franklin')
          //   .style('font-size', '0.7rem')
          //   .style('fill', '#555')
          //   .attr('dy', '-0.2rem')
          //   .attr('dx', '0.3rem')
          //   .text(({ datum }) => `${datum.ath_first_name} ${datum.ath_last_name}`.toUpperCase());
        }

      })
      .merge(points_join);

    // debugger
    const labels_join = frame.selectAll('g.label')
      .data(root.children);

    const labels = labels_join
      .enter()
      .append('g')
      .classed('label', true)
      .append('text')
      .style('font-family', 'nyt-franklin')
      .style('font-size', '0.7rem')
      .style('fill', '#555')
      .attr('dy', '-0.2rem')
      .attr('dx', '0.3rem')
      .text(d => {
        const o = d.children[0].data;
        return `${o.ath_first_name} ${o.ath_last_name}`.toUpperCase();
      })
      .merge(labels_join);

    const width$ = stream.fromEvent(window, 'resize')
      .startWith(window)
      .map(() => $(svg.node().parentNode).innerWidth());

    width$.subscribe(chartWidth => {
      console.log(chartWidth);
      x_axis.ticks(d3.timeYear.every(2));
      const width = chartWidth - margin.left - margin.right;
      x.range([0, width]);
      container.selectAll('.oly-chart')
        .attr('width', chartWidth)
        .select('.axis--x')
        .call(x_axis)
        .each(function() {
          d3.select(this).selectAll('line').style('stroke', '#ddd');
          d3.select(this).selectAll('text').style('font-family', '"nyt-franklin"');
        });
      points.attr('transform', function(d) {
        const circle = d3.select(this).select('circle');
        const radius = circle.size() ? parseFloat(circle.attr('r')) : 0;
        const offset = radius + 1;
        return `translate(${x(d.parsed_date)-offset}, 0)`;
      });
      labels.attr('transform', parent => {
        const { children: [ { data } ] } = parent;
        const parsed_date = getPoints(data)[0].parsed_date;
        return `translate(${x(parsed_date)}, ${y_cluster(data.id)})`;
      });
      rows.select('line')
        .datum(d => getPoints(d).map(d => d.parsed_date))
        .each(d => {
          const pixel_length = x(d[1]) - x(d[0]);
          console.log(pixel_length);
        })
        .attr('x1', d => x(d[0]))
        .attr('x2', d => x(d[1]));
    });
  };
}

function version_1(d3, $) { // jshint ignore:line
  return function(data) {
    const margin = {top: 20, right: 20, bottom: 30, left: 40};
    const height = 200;

    const svg = d3.select('#g-graphic')
      .append('svg')
      .attr('id', 'g-oly-1')
      .classed('oly-chart', true)
      .attr('height', height + margin.top + margin.bottom)
      .style('border', '1px solid red');

    const frame = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const cluster = d3.cluster();

    const x = d3.scaleTime()
      .domain([new Date(2004, 0, 0), new Date(2015, 0, 0)]);

    const root = get_hierarchy(data.rows);

    cluster.size([ height, 0 ])(root);
    const leaves = root.leaves();

    const y = d3.scaleOrdinal()
      .domain(leaves.map(d => d.data.value))
      .range(leaves.map(d => d.x));

    const medal_color = d3.scaleOrdinal()
      .domain(['g','s','b'])
      .range(['gold', 'silver', '#C9AE5D']);

    frame.selectAll('.point')
      .data(data.rows)
      .enter()
      .append('g')
      .classed('point', true)
      .each(function() {
        // d3.select(this).append('text').text(d => d.medal)
      })
      .append('circle')
      .attr('r', 3)
      // .style('fill', d => medal_color(d.medal));
      .style('fill', d => ['g','s','b'].indexOf(d.medal) !== -1 ? medal_color(d.medal) : 'red'); // medal_color(d.medal));
      // .style('fill', d => { medal_color; debugger })

    resizeAll();

    function resizeAll() {
      d3.selectAll('.oly-chart')
        .attr('width', function() {
          return $(this.parentNode).innerWidth();
        });
      var newWidth = svg.node().parentNode.clientWidth - margin.left - margin.right;
      x.rangeRound([0, newWidth]);
      frame.selectAll('.point')
        .attr('transform', ({ year, month, day, full_name }) =>  {
          const date = new Date(year, parseInt(month) - 1, day);
          return `translate(${x(date)}, ${y(full_name)})`;
        });
    }

    d3.select(window).on('resize', resizeAll);

    function get_hierarchy(data) {
      const nested = d3.nest()
        .key(() => "_root")
        .key(d => d.id)
        .key(d => d.athlete_order)
        .rollup(d => d[0].full_name)
        .entries(data);
      const tree = d3.hierarchy(nested[0], d => d.values);
      return tree;
    }
  };
}
