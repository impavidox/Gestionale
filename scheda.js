app.controller('scheda', function($scope, $rootScope, $stateParams) {
	
	$rootScope.showHeader = false; 
	
	if ($stateParams.idsocio != undefined){
		console.log(">> scheda:" + $stateParams.idsocio)
	   	var nRecev = rest('ricevuta/prepareScheda/' + $stateParams.idsocio).get()
    	nRecev.$promise.then(function(x){
    		$rootScope.showHeader = false; 
    		$scope.socioScheda = x;
    		$scope.date = new Date(x.abbonamento.incription);
    	});
	}
});