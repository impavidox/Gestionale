app.controller('ricerca', function($scope, $rootScope, $stateParams) {
	$scope.scadenzaAbb=true;
	$scope.anagrafica=true;
	$scope.scadenzaVMedi=true;
	$scope.scadenzaQAss=true;
	$scope.affiliazione=false;
	$rootScope.showHeader = false; 
	$rootScope.incassato = false; 
	$scope.viewFiltro = false;
	
	
	if ($stateParams.cognome != undefined){
		$rootScope.showHeader = false;
		var nome = null;
		var cognome = ($stateParams.cognome.length > 0) ? $stateParams.cognome : null;
		$scope.titolo = $stateParams.titolo.toUpperCase();
		if ($stateParams.attivita > 0) 	$rootScope.incassato = true; 

		rest('socio/retrieveSocio/' + nome + '/' + cognome +
				'/' + $stateParams.scadenza + 
				'/' + $stateParams.attivita +
				'/' + $stateParams.scadute + 
				'/' + $stateParams.anno).query()
			.$promise.then(function(x){
				$scope.data = x;
		});		
		$scope.viewFiltro = true;

	}
	$scope.closeFilter = function(){
		$scope.viewFiltro = false;
	}
	$scope.showFilter = function(){
		$scope.viewFiltro = true;
	}
	
	 $scope.scopeChange = function(s,v){
		 $scope[s] = v;
	 }
	 


});