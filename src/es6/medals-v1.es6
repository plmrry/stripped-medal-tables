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
  doping(d3, $, Rx, _)(d3.select('#g-graphic'), data.stripped_data_v3);
}); // end require

function doping(d3, $, Rx, _) { // jshint ignore:line
  const RADIUS = 10;
  return function(container, data) { // jshint ignore:line
    const years = [ 2008 ];
    const parsed = years.map(year => get_year_data(data, year));
    const points = _.flatten(parsed);
    console.log(points);
    const countries = _.chain(points)
      .map(d => d.dates.map(e => e.country))
      .flatten()
      .unique()
      .filter(d => d)
      .value();

    const width = 600;
    const height = 600;
    const radius = width * 0.4;

    const svg = container.append('svg')
      .style('border', '1px solid grey')
      .style('width', width)
      .style('height', height);

    const frame = svg.append('g')
      .classed('frame', true)
      .attr('transform', `translate(${width/2}, ${height/2})`);

    var angle = d3.scalePoint()
      .domain(countries)
      .range([0, Math.PI * 2])
      .padding(0.5);

    const country_x = country => Math.sin(angle(country)) * radius;
    const country_y = country => Math.cos(angle(country)) * radius;

    frame.selectAll('.country')
      .data(countries)
      .enter()
      .append('g').classed('country', true)
      .each(function() {
        const font_size = 0.6;
        // d3.select(this).append('circle').attr('r', 5);
        d3.select(this).append('text').text(d => d)
          .attr('text-anchor', 'middle')
          .style('font-size', `${font_size}rem`)
          .style('text-transform', 'uppercase')
          .attr('alignment-baseline', 'middle');
      })
      .attr('transform', d => {
        return `translate(${country_x(d)}, ${country_y(d)})`;
      });

    const medal_color = d3.scaleOrdinal()
      .domain(['gold', 'silver', 'bronze'])
      .range(['gold', 'silver', '#C9AE5D']);

    frame.selectAll('.medal')
      .data(points)
      .enter()
      .append('g').classed('medal', true)
      .append('circle')
      .attr('r', RADIUS)
      .style('opacity', 0.7)
      .style('fill', d => medal_color(d.medal));

    let date = null;

    const forceX = d3.forceX(d => {
      if (!date) return 0;
      const filtered = d.dates.filter(e => date > e.date);
      const latest_date = _.last(filtered);
      if (! latest_date) return 0;
      const country = latest_date.country;
      if (! country) return 0;
      // if (_.isNaN(country_x(country))) debugger;
      return country ? country_x(country) : 0;
    });

    const forceY = d3.forceY(d => {
      if (!date) return 0;
      const filtered = d.dates.filter(e => date > e.date);
      const latest_date = _.last(filtered);
      if (! latest_date) return 0;
      const country = latest_date.country;
      if (! country) return 0;
      // if (_.isNaN(country_y(country))) debugger;
      return country ? country_y(country) : 0;
    });

    var forceCollide = d3.forceCollide(RADIUS)
    	.strength(0.8);

    const force = d3.forceSimulation(points)
      .force('x', forceX)
      .force('y', forceY)
      .force('collide', forceCollide)
      .on('tick', function() {
        frame.selectAll('.medal')
          .attr('transform', d => {
            // if (_.isNaN(d.x)) debugger;
            return `translate(${d.x}, ${d.y})`;
          });
      });

    const timeDomain = [new Date('2007-10-01'), new Date('2016-12-30')];

    const date$ = addControls({ container, width, timeDomain });

    date$.subscribe(_date => {
      date = _date;
      force.nodes(points).alpha(1).restart();
    });
  };

  function addControls({ container, width, timeDomain }) {
    const date$ = new Rx.ReplaySubject(1);

    const height = 100;
    const margin = { top: height/2, left: 20, right: 20 };
    const frameWidth = width - margin.left - margin.right;
    const div = container.append('div');
    const svg = div.append('svg')
      .style('width', width)
      .style('height', height)
      .style('border', '1px solid #aaa');
    const frame = svg.append('g')
      .classed('frame', true)
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const scale = d3.scaleTime()
      .domain(timeDomain)
      .range([0, frameWidth]);

    let playing = false;

    date$.subscribe(date => {
      const dot_join = frame.selectAll('.current-date')
        .data([date]);
      dot_join.enter()
        .append('g')
        .classed('current-date', true)
        .each(function() {
          d3.select(this).append('circle')
            .attr('r', '4')
            .style('opacity', 0.9);
        })
        // .attr('data-transform-x', d => scale(d))
        .attr('transform', d => `translate(${scale(d)}, 0)`)
        .merge(dot_join)
        .transition()
        .duration(playing ? 0 : 500)
        .attr('transform', d => `translate(${scale(d)}, 0)`);
    });

    const axis_g = frame.append('g').classed('axis axis--x', true);

    const axis = d3.axisBottom(scale)
      // .tickSize(0)
      .tickSizeOuter(0)
      .tickPadding(10);

    axis_g.call(axis);

    const buttons = div.append('div').classed('buttons', true);
    buttons.append('button').text('play').classed('play', true);
    buttons.selectAll('button.date')
      .data(['2008-08-02', '2009-12-01', '2016-09-01'])
      .enter().append('button')
      .classed('date', true)
      .text(d => d);

    const dateTweenScale = d3.scaleLinear()
      .range(timeDomain);

    const animate$ = Rx.Observable.create(observer => {
      buttons.select('.play').on('click', function() {
        d3.transition()
          .duration(5000)
          .ease(d3.easeLinear)
          .tween('animate', function() {
            return function(t) {
              playing = t < 1 ? true : false;
              const date = dateTweenScale(t);
              observer.onNext(date);
            };
          })
          .on('end', () => { playing = false; })
          .on('interrupt', () => { playing = false; });
      });
    });

    const click$ = Rx.Observable.create(observer => {
      buttons.selectAll('button.date').on('click', function(d) {
        const date = new Date(d);
        observer.onNext(date);
      });
    }).shareReplay(1);

    const dateSink$ = Rx.Observable.merge(animate$, click$)
      .startWith(new Date('2008-07-15'));

    dateSink$.subscribe(date$);

    return date$;
  }

  function get_year_data(data, target_year) {
    const year = data.filter(d => parseInt(d.oly_year) === target_year);
    const parsed = year.map(row => {
      // NOTE: Assuming August 1st
      const award_date = new Date(parseInt(row.oly_year), 8 - 1, 1);
      const stripped_date = new Date(row.stripped_date);
      const dates = [award_date, stripped_date];
      const stripped_medal = row.stripped_medal.toLowerCase();
      const was_upgraded = row.was_upgraded.match(/yes/);
      const { oly_year } = row;
      if (!was_upgraded) {
        const medals = [{ event: row.event, oly_year, medal: stripped_medal }];
        medals[0].dates = [
          { date: dates[0], country: row.country.toLowerCase() },
          { date: dates[1], country: null }
        ];
        return medals;
      } else {
        const parsed = row.upgrade_athletes.match(/\(.+?\)/g)
          .map(d => d.match(/\((.+?),.+?,(.+?)\)/));
        const medals = parsed.map(d => d[1]);
        const other_countries = parsed.map(d => d[2].trim());
        const countries = [row.country].concat(other_countries).map(d => d.toLowerCase());
        const out = medals.map((medal, i) => {
          return {
            oly_year,
            event: row.event,
            medal: medal.toLowerCase(),
            dates: [
              { date: dates[0], country: countries[i] },
              { date: dates[1], country: countries[i + 1] }
            ]
          };
        });
        return out;
      }
      return [];
    });
    const flat = _.flatten(parsed);
    return flat;
  }
}
