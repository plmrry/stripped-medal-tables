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
  '_nytg/data',
  'node_modules/rx/dist/rx.all'
], function(NYTG_ASSETS, NYTG_BIG_ASSETS, $, _, PageManager, Analytics, balanceText, d3, data, Rx) { // jshint ignore:line
  const HEIGHT = 600;
  const COUNTRY_RATIO = 0.1;
  main(d3, $, Rx, _)({
    container: d3.select('#g-graphic'),
    data: data.stripped_data_v3,
    height: HEIGHT,
    country_ratio: 0.1
    // country_radius: COUNTRY_RADIUS
  });
}); // end require

function main(d3, $, Rx, _) {
  const country_force = d3.forceSimulation()
    .force('center', d3.forceCenter(100, 100))
    .force('x', d3.forceX().strength(0.01))
    .force('y', d3.forceY().strength(0.01))
    .force('collide', d3.forceCollide().strength(0.5));
  return function({ container, data, height, country_ratio }) {
    country_force.force('center').y(height/2);
    country_force.force('y').y(height/2);
    // country_force.force('collide').radius(country_radius);
    const points = get_points(_)(data);
    const countries = _.chain(points)
      .map(d => d.dates.map(e => e.country))
      .flatten()
      .unique()
      .filter(d => d)
      .map(country => ({ country }))
      .value();

    // $(window).load(function() { console.log('window load'); });
    // $(document).ready(function() { console.log('document ready'); });

    console.log('points', points);
    console.log('countries', countries);

    const svg_join = container.selectAll('svg')
      .data(new Array(1));

    const svg = svg_join.enter()
      .append('svg')
      .style('border', '1px solid #ddd')
      .style('height', height)
      .merge(svg_join);

    svg.selectAll('.country')
      .data(countries)
      .enter()
      .append('g').classed('country', true)
      .each(function() {
        const g = d3.select(this);
        g.append('circle')
          .style('fill-opacity', 0.1);
        g.append('text').text(d => d.country)
          .attr('text-anchor', 'middle')
          .style('text-transform', 'uppercase')
          .attr('alignment-baseline', 'middle');
      });


    const width$ = Rx.Observable.fromEvent(window, 'resize')
      .startWith({})
      .map(() => $(container.node().parentNode).innerWidth());

    country_force
      .nodes(countries)
      .on('tick', function() {
        svg.selectAll('.country')
          .attr('transform', d => `translate(${d.x}, ${d.y})`);
      });

    width$.subscribe(width => {
      country_force.force('center').x(width/2);
      country_force.force('x').x(width/2);
      const radius = country_ratio * width;
      country_force.force('collide')
        .radius(radius)
        .initialize(country_force.nodes());
      country_force.alpha(1).restart();
      container.selectAll('svg')
        .style('width', width)
        .selectAll('circle').attr('r', radius);
    });

  };
}


// function doping(d3, $, Rx, _) { // jshint ignore:line
//   const COUNTRY_RADIUS = 50;
//   const MEDAL_RADIUS = 10;
//   return function(container, data) { // jshint ignore:line
//
//   };
// }

function get_points(_) {
  return function(data) {
    const points = _.chain([ 2008 ])
      .map(year => data.filter(d => parseInt(d.oly_year) === year))
      .flatten()
      .map(parse_row)
      .flatten()
      .value();
    return points;
  };
}

function parse_row(row) {
  const {
    oly_year, event, country, upgrade_athletes, stripped_date,
    stripped_medal, was_upgraded
  } = row;
  // NOTE: Assuming August 1st
  const award_date = `${parseInt(oly_year)}-08-01`;
  const dates = [award_date, stripped_date].map(d => new Date(d));
  const [ medals, other_countries ] = was_upgraded.match(/yes/) ?
    parsed_info(upgrade_athletes) :
    [[stripped_medal], [null]];
  const countries = [country.toLowerCase()].concat(other_countries);
  return medals.map(m => m.toLowerCase())
    .map((medal, i) => {
      return {
        oly_year,
        event,
        medal,
        dates: [
          { date: dates[0], country: countries[i] },
          { date: dates[1], country: countries[i + 1] }
        ]
      };
    });
}

function parsed_info(string) {
  const parsed = parse_ath_string(string);
  const medals = parsed.map(d => d[1]);
  const countries = parsed.map(d => d[2].trim().toLowerCase());
  return [ medals, countries ];
}

function parse_ath_string(string) {
  return string.match(/\(.+?\)/g)
    .map(d => d.match(/\((.+?),.+?,(.+?)\)/)); // (gold, john doe, russia)
}
