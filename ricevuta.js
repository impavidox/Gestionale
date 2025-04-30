app.controller('ricevuta', function($scope, $rootScope, $stateParams) {
	$scope.nFattura = "N.D."
	$scope.activitySelected;
	$scope.affSelected = 0;
	$rootScope.showHeader = false; 

	if ($stateParams.idsocio != undefined && $stateParams.reprint == 0){
	   	var nRecev = rest('ricevuta/createNewRicevuta/' + $stateParams.idsocio).get()
    	nRecev.$promise.then(function(x){
    		$scope.socioRicevuta = x
    		$scope.dataRicevuta = x.dataRicevuta;
    		$scope.dataQuota = x.dataQuota;
    		$scope.periodo   = x.dataPeriodo
			$scope.editRicevuta = true;

    	});
	}
	if ($stateParams.idsocio != undefined && $stateParams.reprint == 1){
	   	var nRecev = rest('ricevuta/buildRicevuta/' + $stateParams.idsocio + "/" + $stateParams.abbo + "/" + $stateParams.ricevuta).get()
    	nRecev.$promise.then(function(x){
    		$rootScope.showHeader = false; 
    		$scope.socioRicevuta = x
    		$scope.nFattura = x.nFattura;
			$scope.dataQuota = x.dataQuota;
    		$scope.periodo   = x.dataPeriodo;
    		$scope.sommaPay =  x.pagato;
    		$scope.sommaIncassata = x.incassato;
    		$scope.attivitaDesc = x.attivitaDesc;
 			$scope.editRicevuta = false;

    	});
	}

	if ($stateParams.idsocio != undefined && $stateParams.reprint == 2){
	   	var nRecev = rest('ricevuta/buildRicevuta/' + $stateParams.idsocio + "/" + $stateParams.abbo + "/" + $stateParams.ricevuta).get()
    	nRecev.$promise.then(function(x){
    		$rootScope.showHeader = false; 
    		$scope.socioRicevuta = x
    		$scope.dataRicevuta = x.dataRicevuta;
    		$scope.nFattura = x.nFattura;
			$scope.dataQuota = x.dataQuota;
    		$scope.periodo   = x.dataPeriodo;
    		$scope.sommaPay =  x.pagato;
    		$scope.sommaIncassata = x.incassato;
    		$scope.attivitaDesc = x.attivitaDesc;
    		$scope.registrato = x.tipoRicevuta;
       		$scope.quotaAssociativa = x.payQuota;
       		$rootScope.selActiv.forEach(function(y){
				if (y.description.trim() == x.attivitaDesc.trim()) {$scope.selectedActivity = { value: y }; $scope.activitySelected = y.id}
			});
       		
       		$rootScope.selAffiliazione.forEach(function(y){
				if (y.descrizione.trim() == x.affiliazioneDesc.trim()) {$scope.selectedAffilia = { value: y }; $scope.affSelected = y.id;}
			});
       		
			$scope.editRicevuta = true;

    	});
	}

	$scope.attivitaSelected = function(el){
		$scope.activitySelected = el.id;
    }	
	$scope.affilitazzioneSelected = function(el){
		$scope.affSelected = el.id;
    }		
		
	$scope.invia = function(){
		if ($stateParams.reprint == 0) createRicevuta();
		if ($stateParams.reprint == 2) updateRicevuta();
	}

	function createRicevuta(){
		console.log('save for print....' + $scope.dataRicevuta + " >> activitySelected :" + $scope.activitySelected + " function:" + $stateParams.reprint);
		if (controlSave()) {
			var body ={
					'tipo' : 0 ,
					'dataRicevuta' : $scope.dataRicevuta ,
					'idSocio' : $scope.socioRicevuta.idSocio ,
					'periodo'    : $scope.periodo ,
					'dataQuota'  : $scope.dataQuota ,
					'sommaPay'  : $scope.sommaPay ,
					'sommaIncassata'  : $scope.sommaIncassata ,
					'registrato' : ($scope.registrato == undefined) ? false :  $scope.registrato,
					'quotaAssociativa' : ($scope.quotaAssociativa == undefined) ? false : $scope.quotaAssociativa ,
					'attivita' : $scope.activitySelected,
					'affiliazione' : $scope.affSelected,
			}
			
			var resultSave = rest("ricevuta/printNewRicevuta").save(body);
			resultSave.$promise.then(function(x){
	    		if (!x.testPrint) alert(x.messageError);
	    		else {
	    			$scope.nFattura = x.nFattura;
	    			$scope.dataQuota = x.dataQuota;
	        		$scope.periodo   = x.dataPeriodo;
	         		$scope.attivitaDesc = x.attivitaDesc;
	         		$scope.sommaPay =  x.pagato;
	        		$scope.editRicevuta = false;
	    		}
	    		
	    	});
		} else {
			alert('Tutti parametri non sono stati compilati');
		}
	}
	function updateRicevuta(){
		console.log('Update Ricevuta....' + $scope.dataRicevuta + " >> activitySelected :" + $scope.activitySelected + " function:" + $stateParams.reprint);
		if (controlSave()) {
			var body ={
					'tipo' : 1 ,
					'dataRicevuta' : $scope.dataRicevuta ,
					'idSocio' : $scope.socioRicevuta.idSocio ,
					'idRicevuta' : $scope.socioRicevuta.idRicevuta,
					'idAbbonamento' :  $stateParams.abbo,
					'periodo'    : $scope.periodo ,
					'dataQuota'  : $scope.dataQuota ,
					'sommaPay'  : $scope.sommaPay ,
					'sommaIncassata'  : $scope.sommaIncassata ,
					'registrato' : ($scope.registrato == undefined) ? false :  $scope.registrato,
					'quotaAssociativa' : ($scope.quotaAssociativa == undefined) ? false : $scope.quotaAssociativa ,
					'attivita' : $scope.activitySelected,
					'affiliazione' : $scope.affSelected,
			}
			
			var resultSave = rest("ricevuta/printNewRicevuta").save(body);
			resultSave.$promise.then(function(x){
	    		if (!x.testPrint) alert(x.messageError);
	    		else {
	    			$scope.socioRicevuta.dataRicevuta = $scope.dataRicevuta;
	    			$scope.nFattura = x.nFattura;
	    			$scope.dataQuota = x.dataQuota;
	        		$scope.periodo   = x.dataPeriodo;
	         		$scope.attivitaDesc = x.attivitaDesc;
	         		$scope.sommaPay =  x.pagato;
	        		$scope.editRicevuta = false;
	    		}
	    		
	    	});
		} else {
			alert('Tutti parametri non sono stati compilati');
		}

	}
	function controlSave(){
		if ($scope.activitySelected == undefined) return false;
		if ($scope.affSelected == undefined) return false;
		if ($scope.sommaPay == undefined) return false;
		return true;
	}
});