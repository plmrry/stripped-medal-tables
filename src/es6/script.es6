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
  const HEIGHT = 500;
  // const COUNTRY_RATIO = 0.1;
  main(d3, $, Rx, _)({
    container: d3.select('#g-graphic'),
    data: data.stripped_data_v3,
    height: HEIGHT,
    country_ratio: 0.1
    // country_radius: COUNTRY_RADIUS
  });
}); // end require

function main(d3, $, Rx, _) {

  const medal_color = d3.scaleOrdinal()
    .domain(['gold', 'silver', 'bronze'])
    .range(['gold', 'silver', '#C9AE5D']);

  return function({ container, data, height }) {
    const tables_row = init()({ container, height });
    const flat = get_flat_data(_)(data);
    // debugger
    const timeDomain = [new Date('2007-10-01'), new Date('2016-12-30')];
    const date$ = addControls(d3, Rx)({ container, width: 500, timeDomain });
    date$.subscribe(date => {
      // const filtered = flat.filter(e => date >= e.date);
      const nested = d3.nest()
        .key(d => d.event)
        .entries(flat);
      const events_join = tables_row.selectAll('.event')
        .data(nested);

      const svg_height = 70;
      const events = events_join.enter()
        .append('div')
        .classed('col-sm-3 col-xs-4 event', true)
        // .style('height', '100px')
        .style('border', '1px solid blue')
        .each(function() {
          const div = d3.select(this);
          div.append('h4')
            .style('font-family', 'nyt-franklin')
            .style('font-size', '10px')
            .style('text-transform', 'uppercase')
            .text(d => d.key);
          div.append('svg')
            .style('height', svg_height)
            .style('width', '100%')
            .style('border', '1px solid green')
            .each(function() {
              d3.select(this)
                .append('g').classed('medals', true)
                .attr('transform', 'translate(10, 10)');
              d3.select(this)
                .append('g').classed('countries', true)
                .attr('transform', 'translate(20, 10)');
            });

        })
        .merge(events_join);

      const name_scale = d3.local();

      const ROW_HEIGHT = 10;

      const country_join = events.select('svg')
        .select('.countries')
        // .each(function(d) )
        .selectAll('.country')
        .data(function(d) {
          const { values } = d;
          // const name_scale = d3.scale
          // const date_nest = d3.nest()
          //   .key(d => d.date)
          //   .entries(values);
          // const latest_date = _.chain(date_nest)
          //   .filter(e => date > new Date(e.key))
          //   .last()
          //   .value();
          // if (typeof latest_date === 'undefined') return [];
          const name_nest = d3.nest()
            .key(d => d.name)
            .entries(values);

          const scale = d3.scaleOrdinal()
            .domain(name_nest.map(d => d.key))
            .range(name_nest.map((d,i) => i * ROW_HEIGHT));

          name_scale.set(this, scale);
          // const countries = latest_date.values;
          // debugger
          // const all_names = name_nest;
          return name_nest;
          // return countries;
        }, d => d.key);

      const country_g = country_join.enter()
        .append('g').classed('country', true)
        .append('text')
        .text(d => d.key)
        .style('font-size', '8px')
        .style('text-transform', 'uppercase')
        .style('font-family', 'nyt-franklin')
        .style('alignment-baseline', 'middle')
        .merge(country_join);

      events.selectAll('.country')
        .attr('transform', function(d, i) {
          // name_scale;
          // debugger
          const y = name_scale.get(this)(i);
          return `translate(0, ${y})`;
        });

      const medal_join = events.select('svg')
        .select('.medals')
        .selectAll('.medal')
        .data(({ values }) => {
          const medals_nest = d3.nest()
            .key(d => d.medal)
            .entries(values);
          return medals_nest
        }, d => d.key);

      medal_join.enter()
        .append('g').classed('medal', true)
        .append('circle')
        .attr('r', 3)
        .style('fill', d => medal_color(d.key));

      events.selectAll('.medal')
        .transition()
        .attr('translate', d => {
          date;
          const recent = _.last(d.values.filter(val => date >= val.date));
          if (! recent) debugger;
          debugger;
        })

      // debugger;
    });
  };
}

function init() {
  return function({ container, height }) {
    const _container = container.append('div')
      .classed('container', true)
      .style('border', '1px solid red')
      // .style('height', `${height}px`);
    const tables_row = _container.append('div')
      .classed('row', true);
    return tables_row;
  };
}

function get_flat_data(_) {
  return function(data) {
    const flat = _.chain(data)
      .filter(d => parseInt(d.oly_year) === 2008)
      .map(parse_row_2)
      .flatten()
      .value();
    return flat;
  };
}

// function get_points(_) {
//   return function(data) {
//     const points = _.chain([ 2008 ])
//       .map(year => data.filter(d => parseInt(d.oly_year) === year))
//       .flatten()
//       .map(parse_row_2)
//       .flatten()
//       .value();
//     return points;
//   };
// }

function addControls(d3, Rx) {
  return function({ container, width, timeDomain }) {
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
      .startWith(new Date('2008-08-02'));

    dateSink$.subscribe(date$);

    return date$;
  };
}

function parse_row_2(row) {
  const {
    oly_year, event, country, upgrade_athletes, stripped_date,
    stripped_medal, was_upgraded, name
  } = row;
  const award_date = `${parseInt(oly_year)}-08-01`;
  const dates = [award_date, stripped_date].map(d => new Date(d));
  const [ medals, other_countries, other_names ] = was_upgraded.match(/yes/) ?
    parsed_info(upgrade_athletes) :
    [[stripped_medal], [null], [null]];
  const countries = [country.toLowerCase()].concat(other_countries);
  const names = [name.toLowerCase()].concat(other_names);
  const all = medals.map(m => m.toLowerCase())
    .map((medal, i) => {
      return {
        oly_year,
        event,
        medal,
        dates: [
          { date: dates[0], country: countries[i], name: names[i] },
          { date: dates[1], country: countries[i + 1], name: names[i + 1] }
        ]
      };
    })
    .map(nested => {
      const { oly_year, event, medal } = nested;
      return nested.dates.map(date => {
        return Object.assign({}, date, { oly_year, event, medal });
      });
    });
  return all;
}

// function parse_row(row) {
//   const {
//     oly_year, event, country, upgrade_athletes, stripped_date,
//     stripped_medal, was_upgraded
//   } = row;
//   // NOTE: Assuming August 1st
//   const award_date = `${parseInt(oly_year)}-08-01`;
//   const dates = [award_date, stripped_date].map(d => new Date(d));
//   const [ medals, other_countries ] = was_upgraded.match(/yes/) ?
//     parsed_info(upgrade_athletes) :
//     [[stripped_medal], [null]];
//   const countries = [country.toLowerCase()].concat(other_countries);
//   return medals.map(m => m.toLowerCase())
//     .map((medal, i) => {
//       return {
//         oly_year,
//         event,
//         medal,
//         dates: [
//           { date: dates[0], country: countries[i] },
//           { date: dates[1], country: countries[i + 1] }
//         ]
//       };
//     });
// }

function parsed_info(string) {
  const parsed = parse_ath_string(string);
  const medals = parsed.map(d => d[1]);
  const names = parsed.map(d => d[2].trim().toLowerCase());
  const countries = parsed.map(d => d[3].trim().toLowerCase());
  return [ medals, countries, names ];
}

function parse_ath_string(string) {
  return string.match(/\(.+?\)/g)
    .map(d => d.match(/\((.+?),(.+?),(.+?)\)/)); // (gold, john doe, russia)
}
