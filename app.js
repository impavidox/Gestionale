var prefix = "/cso/rest/";
//var prefix = "/polisportivo/rest/";

var app = angular.module('app', [ 'ui.bootstrap', 'ngAnimate', 'ngResource','ngSanitize','ui.router', 'ui.select', 'ngPrint', 'ngRoute']);
var resource;
var rootScope;

function rest(url) {
	return resource(prefix + url);
}

app.filter('propsFilter', function() {
	  return function(items, props) {
	    var out = [];
	    if (angular.isArray(items)) {
	      var keys = Object.keys(props);

	      items.forEach(function(item) {
	        var itemMatches = false;
	        for (var i = 0; i < keys.length; i++) {
	          var prop = keys[i];
	          var text = props[prop].toLowerCase();
	          // console.log('prop:' + item[prop].toString() + ' text:' + text)
	          // if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
		      if (item[prop].toString().toLowerCase().startsWith(text)) {
	            itemMatches = true;
	            break;
	          }
	        }
	        
	        if (itemMatches) {
	          out.push(item);
	        }
	      });
	    } else {
	      out = items;
	    }
	    return out;
	  };
	});

	app.config([ '$httpProvider', function($httpProvider) {
		$httpProvider.interceptors.push('loading-interceptor');
	} ]);

	app.factory('loading-interceptor', function() {
		var result = {
			"request" : requestHandler,
			"response" : responseHandler
		};
		return result;
	});

	function requestHandler(request){
		rootScope.loading++;
		return request;
	}
	function responseHandler(response) {
		rootScope.loading--;
		return response;
	}

	
app.run(function($rootScope,$filter, $resource,$state,$location,$stateParams, $timeout ,$window) {
	resource = $resource;
	rootScope = $rootScope;
	$rootScope.showHeader = true; 
	$rootScope.showHeader = true; 
	$rootScope.loading = 0;
	
	
	rest('setting/getSetting').get()
		.$promise.then(function(x){
			$rootScope.conf = x;
	});

	var anni = rest('params/retrieveAnnoSportiva').get();
	anni.$promise.then(function(x){
		$rootScope.annoSportiva = x;
		console.log('Anno sportiva :'  + $rootScope.annoSportiva.annoName);	
	});
	rest('activities/retrieveAllActivities').query()
	   .$promise.then(function(x){
			$rootScope.selActiv = x;
		});
	
	rest('activities/retrieveAffiliazioneForLibro/0').query()
		.$promise.then(function(y){
			$rootScope.selAffiliazione = y;
	});

	$rootScope.goNewTab = function (state, param){
	   	var openurlnw =  $state.href(state, param);
    	$window.open(openurlnw,'_blank');
	}
	
	$rootScope.retrieveDate = function (date){
		var myDate = new Date(date);
		var myDateObbj = {
				jj : 0,
				mm : 0,
				yyyy : 0
		}
		myDateObbj.jj = myDate.getDate();
		myDateObbj.mm = myDate.getMonth();
		myDateObbj.yyyy = myDate.getFullYear();
		
    	return myDateObbj;
	}
	$rootScope.formatDate = function (date){
		if (date == null || date == undefined) return '';
		var myDate = new Date(date);
    	return myDate.getDate() + '/' + myDate.getMonth()  + '/' + myDate.getFullYear();
	}
	
});

