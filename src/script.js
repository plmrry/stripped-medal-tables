'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

// jshint esversion: 6, unused: true, undef: true
/* global require, console, window */ // jshint ignore:line

require(['_nytg/NYTG_SLUG/assets', '_nytg/NYTG_SLUG/big-assets', 'jquery/nyt', 'underscore/1.6', 'foundation/views/page-manager', 'nyt5/analytics', 'lib/text-balancer', // uncomment to balance headlines
'node_modules/d3/build/d3', '_nytg/data', 'node_modules/rx/dist/rx.all'], function (NYTG_ASSETS, NYTG_BIG_ASSETS, $, _, PageManager, Analytics, balanceText, d3, data, Rx) {
  // jshint ignore:line
  var HEIGHT = 500;
  main(d3, $, Rx, _)({
    container: d3.select('#g-graphic'),
    data: data.stripped_data_v3,
    height: HEIGHT,
    country_ratio: 0.1
    // country_radius: COUNTRY_RADIUS
  });
}); // end require

function main(d3, $, Rx, _) {

  var medal_color = d3.scaleOrdinal().domain(['gold', 'silver', 'bronze']).range(['gold', 'silver', '#C9AE5D']);

  return function (_ref) {
    var container = _ref.container;
    var data = _ref.data;
    var height = _ref.height;

    var _container = init()({ container: container, height: height });
    var tables_row = _container.append('div').classed('row', true);
    var flat = get_flat_data(_)(data);
    // debugger
    var timeDomain = [new Date('2007-10-01'), new Date('2016-12-30')];
    var date$ = addControls(d3, Rx)({ container: _container, width: 500, timeDomain: timeDomain, data: flat });
    date$.subscribe(function (date) {
      // const filtered = flat.filter(e => date >= e.date);
      var nested = d3.nest().key(function (d) {
        return d.event;
      }).entries(flat);
      var events_join = tables_row.selectAll('.event').data(nested);

      var svg_height = 70;
      var events = events_join.enter().append('div').classed('col-sm-3 col-xs-4 event', true)
      // .style('height', '100px')
      // .style('border', '1px solid blue')
      .each(function (d) {
        var div = d3.select(this);
        var parsed = d.key.match(/^(.+?),(.+)/);

        // console.log(parsed);
        div.append('h4').style('font-family', 'nyt-franklin').style('font-size', '12px').style('text-transform', 'uppercase').style('margin-bottom', '3px').text(function () {
          return parsed[1];
        });

        div.append('h5').style('font-family', 'nyt-franklin').style('font-size', '10px').style('text-transform', 'uppercase').text(function () {
          return parsed[2].trim();
        });
        div.append('svg').style('height', svg_height).style('width', '100%')
        // .style('border', '1px solid green')
        .each(function () {
          d3.select(this).append('g').classed('medals', true).attr('transform', 'translate(10, 10)');
          d3.select(this).append('g').classed('countries', true).attr('transform', 'translate(20, 10)');
        });
      }).merge(events_join);

      var name_scale = d3.local();

      var ROW_HEIGHT = 10;

      // function compareMedals(a, b) {
      //
      // }

      var country_join = events.select('svg').select('.countries').selectAll('.country').data(function (d) {
        var values = d.values;

        var name_nest = d3.nest().key(function (d) {
          return d.name;
        }).entries(values);
        var scale = d3.scaleOrdinal().domain(name_nest.map(function (d) {
          return d.key;
        })).range(name_nest.map(function (d, i) {
          return i * ROW_HEIGHT;
        }));
        name_scale.set(this, scale);
        return name_nest;
      }, function (d) {
        return d.key;
      });

      country_join.enter().append('g').classed('country', true).style('opacity', function (d) {
        return d.key === 'null' ? 0 : 1;
      }).append('text').text(function (d) {
        return d.key === 'null' ? 'un-allocated' : d.key;
      }).style('font-size', '10px').style('text-transform', 'uppercase').style('font-family', 'nyt-franklin').style('alignment-baseline', 'middle').merge(country_join);

      events.selectAll('.country').attr('transform', function (d) {
        // name_scale;
        // debugger
        var y = name_scale.get(this)(d.key);
        return 'translate(0, ' + y + ')';
      });

      var medal_join = events.select('svg').select('.countries').selectAll('.medal').data(function (_ref2) {
        var values = _ref2.values;

        var medals_nest = d3.nest().key(function (d) {
          return d.medal;
        }).entries(values);
        return medals_nest;
      }, function (d) {
        return d.key;
      });

      medal_join.enter().append('g').classed('medal', true).append('circle').attr('r', 3).style('fill', function (d) {
        return medal_color(d.key);
      });

      events.selectAll('.medal').transition().attr('transform', function (d) {
        var recent = _.last(d.values.filter(function (val) {
          return date >= val.date;
        }));
        if (!recent) recent = d.values[0];
        var y = name_scale.get(this)(recent.name);
        var x = -10;
        return 'translate(' + x + ', ' + y + ')';
      });

      events.selectAll('.country').each(function (d) {
        var _d$values$ = d.values[0];
        var is_stripped_ath = _d$values$.is_stripped_ath;
        var stripped_date = _d$values$.stripped_date;

        var has_been_stripped = date >= new Date(stripped_date);
        if (has_been_stripped && d.key === 'null') {
          d3.select(this).transition().style('opacity', 1);
        } else if (d.key === 'null') {
          d3.select(this).transition().style('opacity', 0);
        }
        if (is_stripped_ath && has_been_stripped) {
          var text = d3.select(this).select('text').node();
          var width = $(text).width();
          d3.select(this).selectAll('line').data([width]).enter().append('line').attr('y1', -1).attr('y2', -1).attr('x2', 0).style('opacity', 1).style('stroke', 'red').transition().attr('x2', width);
        } else {
          d3.select(this).selectAll('line').transition().style('opacity', 0).transition().duration(0).remove();
        }
      });
    });
  };
}

function init() {
  return function (_ref3) {
    var container = _ref3.container;

    return container.append('div').style('margin-top', '20px').classed('container', true);
  };
}

function get_flat_data(_) {
  return function (data) {
    var flat = _.chain(data).filter(function (d) {
      return parseInt(d.oly_year) === 2008;
    }).map(parse_row_2).flatten().value();
    return flat;
  };
}

function addControls(d3, Rx) {
  return function (_ref4) {
    var container = _ref4.container;
    var width = _ref4.width;
    var timeDomain = _ref4.timeDomain;
    var data = _ref4.data;

    var all_dates = _.chain(data).filter(function (d) {
      return d.is_stripped_date;
    }).sortBy(function (d) {
      return d.date;
    }).pluck('date').unique().value();

    console.log(all_dates);

    var date$ = new Rx.ReplaySubject(1);

    var height = 100;
    var margin = { top: height / 2, left: 20, right: 20 };
    var frameWidth = width - margin.left - margin.right;
    var div = container.append('div');
    var svg = div.append('svg').style('width', width).style('height', height);

    var frame = svg.append('g').classed('frame', true).attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

    var scale = d3.scaleTime().domain(timeDomain).range([0, frameWidth]);

    var playing = false;

    frame.selectAll('.date').data(all_dates).enter().append('g').classed('date', true).attr('transform', function (d) {
      return 'translate(' + scale(d) + ', 0)';
    }).append('circle').attr('r', 2);

    date$.subscribe(function (date) {
      var dot_join = frame.selectAll('.current-date').data([date]);
      dot_join.enter().append('g').classed('current-date', true).each(function () {
        d3.select(this).append('circle').attr('r', 4).style('opacity', 0.9);
      })
      // .attr('data-transform-x', d => scale(d))
      .attr('transform', function (d) {
        return 'translate(' + scale(d) + ', -10)';
      }).merge(dot_join).transition().duration(playing ? 0 : 500).attr('transform', function (d) {
        return 'translate(' + scale(d) + ', -10)';
      });
    });

    var axis_g = frame.append('g').classed('axis axis--x', true);

    var axis = d3.axisBottom(scale)
    // .tickSize(0)
    .tickSizeOuter(0).tickPadding(10);

    axis_g.call(axis);

    var buttons = div.append('div').classed('buttons', true);

    var next$ = Rx.Observable.create(function (observer) {
      var current = -1;
      buttons.append('button').text('next').on('click', function () {
        current++;
        if (current === all_dates.length) current = 0;
        var date = all_dates[current];
        observer.onNext(date);
      });
    });

    buttons.selectAll('button.date').data(['2008-08-02', '2009-12-01', '2016-09-01']).enter().append('button').classed('date', true).text(function (d) {
      return d;
    });

    var dateTweenScale = d3.scaleLinear().range(timeDomain);

    var animate$ = Rx.Observable.create(function (observer) {
      buttons.select('.play').on('click', function () {
        d3.transition().duration(5000).ease(d3.easeLinear).tween('animate', function () {
          return function (t) {
            playing = t < 1 ? true : false;
            var date = dateTweenScale(t);
            observer.onNext(date);
          };
        }).on('end', function () {
          playing = false;
        }).on('interrupt', function () {
          playing = false;
        });
      });
    });

    var click$ = Rx.Observable.create(function (observer) {
      buttons.selectAll('button.date').on('click', function (d) {
        var date = new Date(d);
        observer.onNext(date);
      });
    }).shareReplay(1);

    var dateSink$ = Rx.Observable.merge(animate$, click$, next$).startWith(new Date('2008-08-02'));

    dateSink$.subscribe(date$);

    return date$;
  };
}

function parse_row_2(row) {
  var oly_year = row.oly_year;
  var event = row.event;
  var country = row.country;
  var upgrade_athletes = row.upgrade_athletes;
  var stripped_date = row.stripped_date;
  var stripped_medal = row.stripped_medal;
  var was_upgraded = row.was_upgraded;
  var name = row.name;
  // const stripped_athlete = name;

  var award_date = parseInt(oly_year) + '-08-01';
  var dates = [award_date, stripped_date].map(function (d) {
    return new Date(d);
  });

  var _ref5 = was_upgraded.match(/yes/) ? parsed_info(upgrade_athletes) : [[stripped_medal], [null], [null]];

  var _ref6 = _slicedToArray(_ref5, 3);

  var medals = _ref6[0];
  var other_countries = _ref6[1];
  var other_names = _ref6[2];

  var countries = [country.toLowerCase()].concat(other_countries);
  var names = [name.toLowerCase()].concat(other_names);
  var is_stripped = [true];
  var all = medals.map(function (m) {
    return m.toLowerCase();
  }).map(function (medal, i) {
    return {
      oly_year: oly_year,
      event: event,
      medal: medal,
      dates: [{ date: dates[0], country: countries[i], name: names[i], is_stripped_ath: is_stripped[i] }, { date: dates[1], is_stripped_date: true, country: countries[i + 1], name: names[i + 1], is_stripped_ath: is_stripped[i + 1] }]
    };
  }).map(function (nested) {
    var oly_year = nested.oly_year;
    var event = nested.event;
    var medal = nested.medal;

    return nested.dates.map(function (date) {
      return Object.assign({}, date, { oly_year: oly_year, event: event, medal: medal, stripped_date: stripped_date });
    });
  });
  return all;
}

function parsed_info(string) {
  var parsed = parse_ath_string(string);
  var medals = parsed.map(function (d) {
    return d[1];
  });
  var names = parsed.map(function (d) {
    return d[2].trim().toLowerCase();
  });
  var countries = parsed.map(function (d) {
    return d[3].trim().toLowerCase();
  });
  return [medals, countries, names];
}

function parse_ath_string(string) {
  return string.match(/\(.+?\)/g).map(function (d) {
    return d.match(/\((.+?),(.+?),(.+?)\)/);
  }); // (gold, john doe, russia)
}
