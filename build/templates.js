define(function() {

var templates = {};

templates['jst'] = {};

templates['jst']['example_template'] = function(obj){
var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};
with(obj||{}){
__p+='<p>'+
((__t=( text ))==null?'':__t)+
'</p>';
}
return __p;
}

return templates;

})