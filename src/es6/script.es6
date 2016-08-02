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
  return function(container, data) { // jshint ignore:line
    const year = data.filter(d => parseInt(d.oly_year) === 2008);
    const parsed = year.map(row => {
      // NOTE: Assuming August 1st
      const award_date = new Date(parseInt(row.oly_year), 8 - 1, 1);
      const stripped_date = new Date(row.stripped_date);
      const dates = [award_date, stripped_date];
      const stripped_medal = row.stripped_medal.toLowerCase();
      const was_upgraded = row.was_upgraded.match(/yes/);
      if (!was_upgraded) {
        const medals = [{ event: row.event, oly_year: year, medal: stripped_medal }];
        medals[0].dates = [
          { date: dates[0], country: row.country },
          { date: dates[1], coutnry: null }
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
            oly_year: year,
            event: row.event,
            medal: medal.toLowerCase(),
            dates: [
              { date: dates[0], country: countries[i] },
              { date: dates[1], country: countries[i + 1] }
            ]
          };
        });
        // console.log(medals, countries);
        // console.log(out);
        return out;
      }
      return [];
    });
    const flat = _.flatten(parsed);
    console.log(flat);
  };
}
