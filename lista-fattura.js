app.controller('lista-fattura', function($scope, $rootScope, $stateParams) {
	
	$scope.back = function(){
	 	// console.log('showListUser:' + $scope.showListUser + ' viewScelta:' + $scope.viewScelta + " showListfacture:" + $scope.showListfacture);
	 	$scope.viewSceltaList = false;
	 	$scope.viewIncasso = false;
	 	$scope.backFattura();
     }
	
	$scope.ricevutaSelected = function(x){
		$scope.itemSel = x;
	 	$scope.viewSceltaList = true;
	}
	$scope.closeAlertList = function(){
	 	$scope.viewSceltaList = false;		
	}
	$scope.closeAlertIncasso = function(){
	 	$scope.viewSceltaList = false;	
	 	$scope.viewIncasso = false;
	}
	$scope.visuRicevuta = function(){
		var param = {
			'reprint' : 1,
			'idsocio' :  $scope.itemSel.idSocio,
			'abbo'    :  $scope.itemSel.idAttivitaAbbonamentoAffiliazione,
			'ricevuta' : $scope.itemSel.idRicevuta
		}
		$rootScope.goNewTab('ricevuta', param);
	}

	$scope.editRicevuta = function(){
		var param = {
			'reprint' : 2,
			'idsocio' :  $scope.itemSel.idSocio,
			'abbo'    :  $scope.itemSel.idAttivitaAbbonamentoAffiliazione,
			'ricevuta' : $scope.itemSel.idRicevuta
		}
		$rootScope.goNewTab('ricevuta', param);
	}
	$scope.incassoRicevuta = function(){
	 	$scope.viewSceltaList = false;
	 	$scope.viewIncasso = true;		
		console.log("incassoRicevuta:"  + $scope.itemSel.idRicevuta);
		
	}
	$scope.confirmIncasso = function(){
		console.log("incassoRicevuta:"  + $scope.itemSel.importoIncassato);
      	var body = {
				"idRicevuta" : $scope.itemSel.idRicevuta,
				"sommaIncassato" : $scope.itemSel.importoIncassato
			}
	       	var resultAbo = rest("ricevuta/updateIncassi").save(body);
	       	resultAbo.$promise.then(function(result){
        		alert('La ricevuta Ã© stata aggiornata.')
        	});
		$scope.back();
		
	}
	$scope.removeRicevuta = function(){
       	var body = {
				"idRicevuta" : $scope.itemSel.idRicevuta
			}
	       	var resultAbo = rest("ricevuta/annulRicevuta").save(body);
	       	resultAbo.$promise.then(function(result){
        		$scope.viewSceltaList = !result.rc;        		
        		console.log('>>> $emit ......')
        		$scope.$emit("update_list_fattura");
        		alert('La ricevuta Ã© stata annulata.')
        	});
	}
});