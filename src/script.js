'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

// jshint esversion: 6, unused: true, undef: true
/* global require, console, window */ // jshint ignore:line

require(['_nytg/NYTG_SLUG/assets', '_nytg/NYTG_SLUG/big-assets', 'jquery/nyt', 'underscore/1.6', 'foundation/views/page-manager', 'nyt5/analytics', 'lib/text-balancer', // uncomment to balance headlines
'node_modules/d3/build/d3', '_nytg/data', 'node_modules/rx/dist/rx.all'], function (NYTG_ASSETS, NYTG_BIG_ASSETS, $, _, PageManager, Analytics, balanceText, d3, data, Rx) {
  // jshint ignore:line
  doping(d3, $, Rx, _)(d3.select('#g-graphic'), data.stripped_data_v3);
}); // end require

function doping(d3, $, Rx, _) {
  // jshint ignore:line
  return function (container, data) {
    // jshint ignore:line
    var year = data.filter(function (d) {
      return parseInt(d.oly_year) === 2008;
    });
    var parsed = year.map(function (row) {
      // NOTE: Assuming August 1st
      var award_date = new Date(parseInt(row.oly_year), 8 - 1, 1);
      var stripped_date = new Date(row.stripped_date);
      var dates = [award_date, stripped_date];
      var stripped_medal = row.stripped_medal.toLowerCase();
      var was_upgraded = row.was_upgraded.match(/yes/);
      if (!was_upgraded) {
        // console.info('was not upgraded');
        var medals = [{ event: row.event, medal: stripped_medal }];
        medals[0].dates = [{ date: dates[0], country: row.country }, { date: dates[1], coutnry: null }];
        return medals;
      } else {
        var _ret = function () {
          var parsed = row.upgrade_athletes.match(/\(.+?\)/g).map(function (d) {
            return d.match(/\((.+?),.+?,(.+?)\)/);
          });
          var medals = parsed.map(function (d) {
            return d[1];
          });
          var other_countries = parsed.map(function (d) {
            return d[2].trim();
          });
          var countries = [row.country].concat(other_countries).map(function (d) {
            return d.toLowerCase();
          });
          var out = medals.map(function (medal, i) {
            return {
              oly_year: year,
              event: row.event,
              medal: medal.toLowerCase(),
              dates: [{ date: dates[0], country: countries[i] }, { date: dates[1], country: countries[i + 1] }]
            };
          });
          // console.log(medals, countries);
          // console.log(out);
          return {
            v: out
          };
        }();

        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
      }
      return [];
    });
    var flat = _.flatten(parsed);
    console.log(flat);
  };
}
