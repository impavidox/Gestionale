app.controller('prima-nota', function ($scope, $rootScope, $stateParams) {
	var vm = this;
	
	$scope.dt = new Date();
	$scope.tot = 0;
	$scope.viewNumeroTessera = false;
	$scope.viewTesseraDup = false;
	$scope.viewPrima = true;
	$scope.viewStat = false;
	
	$scope.data= rest('primanota/buildPrimaNota/0').get();
	$scope.updLast = false;
	$scope.updCtr  = false;
	$scope.updEmpty = false;
	$scope.numeroTesseraUpd = null;
	$scope.emptyTable = [];
	
	rest("utility/cntrlNumeroTessera/2").get().$promise.then(function(r){
		$scope.viewNumeroTessera = r.tesseraOK;
		$scope.tesseraEmpty = r.tesseraEmpty.toString();
		$scope.tesseraDup  = r.tesseraDup.toString();
		$scope.emptyTable = r.tesseraEmpty;
		
	});  
	
	$scope.closeAlert = function(){
		$scope.viewNumeroTessera = false;
	}
	
	$scope.updNTessera = function(){
		console.log('>>> updLast:' + $scope.updLast + " updCtr:" + $scope.updCtr + " updEmpty" + $scope.updEmpty + " numeroTesseraUpd:" + $scope.numeroTesseraUpd);
		var isOK = true;
//		if ($scope.updCtr && $scope.numeroTesseraUpd == null)  isOK = false;
//		if ($scope.updEmpty && $scope.numeroTesseraUpd == null) isOK = false;
//		if (!isOK) alert("Numero di tessera obligatoria per questa funzione");
		if (isOK){
			$scope.viewNumeroTessera=false;
			console.log("nombre de tessera vide:" + $scope.emptyTable.length)
			$scope.updLast = true;
			var body = {
					'extend' : $scope.updCtr,
					'emtpy' : $scope.updEmpty,
					'last' : $scope.updLast,
					'tessera' : $scope.emptyTable
				}
				rest("utility/updateNumeroTesseraAlert").save(body)
				.$promise.then(function(r){
					if (r.rc) {
						$scope.viewNumeroTessera=false;
					} else 
						$scope.msgError = r.message;
				});
		}
	}

	 $scope.scopeChange = function(s,v){
		 $scope[s] = v;
	 }

	
	$scope.esegui = function() {
		var dateDeb = buildDate($scope.begin);
		var dateFin = buildDate($scope.end);
		if (vm.typeList.selected == undefined) vm.typeList.selected = vm.typeList[0];
//		console.log('.... valeur de deb:' + dateDeb + ' value de fin:' + dateFin + " tipo:" + vm.typeList.selected.code);
		$scope.data= rest('primanota/buildPrimaNota/' + vm.typeList.selected.code + '/' + dateDeb + "/" + dateFin).get();
	}
	
	$scope.printPimaNota = function(){
		var dateDeb = $scope.begin;
		var dateFin = $scope.end;
		if (vm.typeList.selected == undefined) vm.typeList.selected = vm.typeList[0];
//		console.log('printPimaNota.... valeur de deb:' + dateDeb + ' value de fin:' + dateFin + " tipo:" + vm.typeList.selected.code);
		$rootScope.goNewTab('primaNota', {'type' : vm.typeList.selected.code,
			'begin' :dateDeb,
			'end' : dateFin
			});		

	}
	/*
	$scope.data.$promise.then(
			function(data){
				$scope.tot = data.totale;
			}
	);
	*/
	function buildDate(myDate){
		var r = "";
		if (myDate != undefined ) {
			var w =  new Date(myDate)
			r =  w.getDate()  +  '-' +( w.getMonth() +1)  + '-' + w.getFullYear(); 
		}
		return r;
	}

	vm.typeList = [
		{ name: 'Normale',             code: 0},
		{ name: 'Speciale',            code: 1 },
		{ name: 'Ricevuta Commerciale',code: 2 },
		{ name: 'Fattura Commerciale', code: 3 },
		{ name: 'Fattura',             code: 9 }
	];
	$scope.statisticSelect = function(){
		$scope.viewPrima = false;
		$scope.viewStat = true;
	
		$scope.statistic= rest('primanota/statistic/0').get();
	}

	$scope.primaNote = function(){
		$scope.viewPrima = true;
		$scope.viewStat = false;
	
	}
	
	$scope.titolo = {
			0 : 'Prima Nota',
			1 : 'Prima Nota',
			1 : 'Ricevuta Commerciale',
			1 : 'Fattura Commerciale',
			9 : 'Fattura',
	}
});