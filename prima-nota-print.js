app.controller('prima-nota-print', function($scope, $rootScope, $stateParams) {
	$rootScope.showHeader = false; 
	$scope.viewPrimaNota = false;
	$scope.dt = new Date();
	
	if ($stateParams.type != undefined){
//		console.log(">> scheda:" + $stateParams.type + " begin:" +  $stateParams.begin + ' end:' + $stateParams.end)
		$scope.typeDate = 0;
		if ($stateParams.begin != undefined ) { $scope.dtBegin = new Date($stateParams.begin); $scope.typeDate = 1;}
		if ($stateParams.end != undefined )	  {$scope.dtEnd = new Date($stateParams.end);  $scope.typeDate = 2;}
		if ($stateParams.end != undefined  && $stateParams.begin == undefined ){ $scope.dtBegin = dt; ; $scope.typeDate = 2;}
		
		$rootScope.showHeader = false; 
		var dDeb = ($stateParams.begin == undefined) ? buildDate(new Date()) : buildDate($stateParams.begin);
		var dFin = buildDate($stateParams.end);
		
		$scope.listPrimaNota = rest('primanota/printPrimaNota/'+ $stateParams.type + '/' + dDeb + '/' + dFin).get();
		$scope.listPrimaNota.$promise.then(function(r){
			$scope.viewPrimaNota = true;
		});

		
		
	}	
	
	
	function buildDate(myDate){
		var r = "";
		if (myDate != undefined ) {
			var w =  new Date(myDate)
			return  w.getDate()  +  '-' +(w.getMonth() +1)  + '-' + w.getFullYear(); 
		}
		return r;
	}

});