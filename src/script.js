'use strict';

require(['_nytg/NYTG_SLUG/assets', '_nytg/NYTG_SLUG/big-assets', 'jquery/nyt', 'underscore/1.6', 'foundation/views/page-manager', 'nyt5/analytics', 'lib/text-balancer', // uncomment to balance headlines
'node_modules/d3/build/d3'
// 'queue/1'
// 'resizerScript'     // uncomment this line to include resizerScript
// 'templates'         // uncomment to use src/templates
], function (NYTG_ASSETS, NYTG_BIG_ASSETS, $, _, PageManager, Analytics, balanceText, d3) {

  // begin code for your graphic here:

  d3.select('#g-graphic').append('h1').text('hello');

  // uncomment to balance headline and leadin
  // balanceText('.interactive-headline, .interactive-leadin');

  // templates
  // var html = Templates.jst.example_template({ text: "yo" });

  // custom sharetools
  // <div class="sharetools g-sharetools" data-url="http://www.nytimes.com" data-title="Custom Title"></div>
  // require(['interactive/main'], function() {
  //   require(['shared/sharetools/views/share-tools-container'], function(ShareTools) {
  //     $(".g-sharetools").each(function() {
  //       new ShareTools({ el: $(this) });
  //     });
  //   });
  // });
}); // end require
