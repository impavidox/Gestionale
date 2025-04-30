app.controller('libro-socio-print', function($scope, $rootScope, $stateParams) {
	$rootScope.showHeader = false; 
	$scope.dt = new Date();
	$scope.tipoName = "";
	$scope.headerTipo = "";
	$scope.tipoSelected  = $stateParams.tipo;
	
	if ($stateParams.tipo == 1) {
		$scope.tipoName = "EFFETIVI";
		$scope.headerTipo = "TIPO DI SOCIO";
	} else {
		$scope.tipoName = "TESSARATI";
		$scope.headerTipo = "TESSARATO";
	}
	
	
	if ($stateParams.affiliazione != undefined){
		console.log(">> scheda:" + $stateParams.affiliazione + " begin:" +  $stateParams.begin  + " end:" +  $stateParams.end  + " tipo:" + $stateParams.tipo)
		$rootScope.showHeader = false; 
		$scope.viewlibro = true;
		$scope.listSocioP = rest('socio/retrieveLibroSocio/' + $stateParams.affiliazione + '/' 
				+ $stateParams.begin + '/' + $stateParams.end + '/' + $stateParams.tipo).query();

	}
		
		
});