app.controller('elenco-soci', function($scope, $rootScope, $stateParams) {
	
	$scope.scadenzaSelected = 0;
	$scope.attivitaSelected = 0;
	$scope.viewSearch = false;
	$scope.viewSceltaSoci = false;
	$scope.showDettaglio = false;
	$scope.viewUpdateSocio = false;
	
	$scope.loadValue = false;
	
	$scope.showElenco = true;
	
	$scope.scadenzaList = [
		{ name: 'Scaduto', code: 1},
		{ name: 'Scad. pros. mese',  code: 2 },
	];

	$scope.familiesList = rest('activities/retrieveFamilies').query();
	
	$scope.annoList = 
		
		$scope.annoList = rest('params/retrieveParameters').query();
		$scope.annoList.$promise.then(function(result){
			result.forEach(function(x){
				if (x.status == 1){
					$scope.selectedAnno = { value: x };
					$scope.annoSelected = x.id;
				}
			});
		});
		
		$scope.annoSel = function (el){
			$scope.annoSelected = el.id;
//			console.log('annoSelected:' + $scope.annoSelected)
		}
	
	$scope.famigliaSel = function (el){
		$scope.familySelected = el.id;
		$scope.attivitaSelected = 0;
		rest('activities/retrieveActivitiesByFamily/' + $scope.familySelected).query()
			.$promise.then(function(result){
        		$scope.activitiesList = result;
        	});
	}
	
	$scope.attivitaSel = function (el){
		$scope.attivitaSelected = el.id;
		$scope.attivitaDescriptionSelected = el.description;
//		console.log('attivitaSelected:' + $scope.attivitaSelected)
	}
	$scope.scadenzaSel= function (el){
		$scope.scadenzaSelected = el.code;
//		console.log('scadenzaSelected:' + $scope.scadenzaSelected)
	}
	
	$scope.eseguiSearch = function(){
 		if ($scope.cognomeSearch == undefined || $scope.cognomeSearch =='') $scope.cognomeSearch = null;
		if ($scope.scadute == undefined) $scope.scadute = false;
		if ($scope.scadenzaSelected == undefined) $scope.scadenzaSelected = 0;
		
		console.log('annoSelected:' + $scope.annoSelected + ' attivitaSelected:' + $scope.attivitaSelected + ' scadenzaSelected:' + $scope.scadenzaSelected)
		var nome = null;
		var cognomeSearch = $scope.cognomeSearch;
		rest('socio/retrieveSocio/' + nome + '/' + cognomeSearch +
				'/' + $scope.scadenzaSelected + 
				'/' + $scope.attivitaSelected +
				'/' + $scope.scadute + 
				'/' + $scope.annoSelected).query()
			.$promise.then(function(x){
				$scope.data = x;
				$scope.viewSearch = true;
		});		
	}
	
	
	$scope.printSearch = function(){
//		console.log('>>>>>> printSearch <<<<<<<<<');
		// url : '/search/:cognome/:scadenza/:attivita/:scadute/:anno',
		if ($scope.cognomeSearch == undefined || $scope.cognomeSearch =='') $scope.cognomeSearch = null;
		if ($scope.scadute == undefined) $scope.scadute = false;
		if ($scope.scadenzaSelected == undefined) $scope.scadenzaSelected = 0;
		
		var titolo ='cognome'
		if ($scope.attivitaSelected > 0)
			titolo = $scope.attivitaDescriptionSelected;

		
		
//		console.log('print annoSelected:' + $scope.annoSelected + ' attivitaSelected:' + $scope.attivitaSelected + ' scadenzaSelected:' + $scope.scadenzaSelected)
		var nome = null;
		var cognomeSearch = $scope.cognomeSearch;
		$rootScope.goNewTab('search', {'cognome' : $scope.cognomeSearch,
			'scadenza' :$scope.scadenzaSelected,
			'attivita' : $scope.attivitaSelected,
			'scadute' : $scope.scadute,
			'anno' : $scope.annoSelected,
			'titolo' : titolo
			});		
	}

	$scope.eseguiMail = function(){
//		console.log('>>>>>> printSearch <<<<<<<<<');
		// url : '/search/:cognome/:scadenza/:attivita/:scadute/:anno',
		if ($scope.cognomeSearch == undefined || $scope.cognomeSearch =='') $scope.cognomeSearch = null;
		if ($scope.scadute == undefined) $scope.scadute = false;
		if ($scope.scadenzaSelected == undefined) $scope.scadenzaSelected = 0;
		
		var titolo ='cognome'
		if ($scope.attivitaSelected > 0)
			titolo = $scope.attivitaDescriptionSelected;

		
		
//		console.log('print annoSelected:' + $scope.annoSelected + ' attivitaSelected:' + $scope.attivitaSelected + ' scadenzaSelected:' + $scope.scadenzaSelected)
		var nome = null;
		var cognomeSearch = $scope.cognomeSearch;
		$rootScope.goNewTab('email', {'cognome' : $scope.cognomeSearch,
			'scadenza' :$scope.scadenzaSelected,
			'attivita' : $scope.attivitaSelected,
			'scadute' : $scope.scadute,
			'anno' : $scope.annoSelected,
			'titolo' : titolo
			});		
	}
	
	 $scope.scopeChange = function(s,v){
		 $scope[s] = v;
	 }

	
	$scope.itemelected = function(item){
		$scope.socioSelected = item;
		console.log("statusAbanamento:" + $scope.socioSelected.statusAbanamento);
//		($scope.upd) ?  updateSocio() : $scope.viewSceltaSoci = true;
		$scope.viewSceltaSoci = true;
		
	}
	
	function updateSocio(){
		$scope.viewUpdateSocio = true;
		$scope.upd=false;
	}
	
	$scope.closeAlert = function(){
	   	$rootScope.showHeader = true; 
		$scope.viewSceltaSoci = false;
	}

	$scope.closeUpdate = function(){
	   	$rootScope.showHeader = true; 
		$scope.viewUpdateSocio = false;
	}

	$scope.dettaglio = function(){
//		console.log('user selectionÃ©:' + $scope.socioSelected.nome + " " + $scope.socioSelected.cognome  + " " + $scope.loadValue);
		$scope.loadValue = true;
		$scope.showDettaglio = true;
		$scope.showElenco = false;
		$scope.viewSceltaSoci = false;
	}
	
	$scope.chiudiClient = function(){
		console.log('>>> chiudiClient <<<<<');
		$scope.eseguiSearch();
		$scope.showDettaglio = false;
		$scope.showElenco = true;
		$scope.viewSceltaSoci = false;
		$scope.loadValue = false;
	}
	
	
	
	$scope.ricevutaDirect = function(){
		console.log('user selectionÃ©:' + $scope.socioSelected.nome + " " + $scope.socioSelected.cognome  );
		rest('abbonamento/retrieveCurrentAbbonemanto/' + $scope.socioSelected.id).get()
			.$promise.then(function(x){
				if (x.id == 0) alert("il socio non ha un abbonamento attivo quest'anno");
				if (x.id > 0) $rootScope.goNewTab('ricevuta', {'idsocio' : $scope.socioSelected.id , 'reprint' : 0});					
			});
		
	}
	
    $scope.runFattura = function(){
       	rest('ricevuta/retrieveRicevutaForUser/' +  $scope.socioSelected.id + '/' + $scope.socioSelected.tesseraNumber).query()
		.$promise.then(function(x){
			$scope.lRicevuta = x;

			$scope.showDettaglio = false;
			$scope.showElenco = false;
			$scope.viewSceltaSoci = false;
			$scope.loadValue = false;
	    	$scope.showListfacture = true;
		});		
    }

    
    $scope.backFattura = function(){
		$scope.showElenco = true;

    	$scope.showDettaglio = false;
		$scope.viewSceltaSoci = false;
		$scope.loadValue = false;
		$scope.showListfacture = false;
      	
    }

	
	$scope.schedaDirect= function(){
//		console.log('user selectionÃ©:' + $scope.socioSelected.nome + " " + $scope.socioSelected.cognome  );
		rest('abbonamento/retrieveCurrentAbbonemanto/' + $scope.socioSelected.id).get()
			.$promise.then(function(x){
				if (x.id == 0) alert("il socio non ha un abbonamento attivo quest'anno");
				if (x.id > 0) $rootScope.goNewTab('scheda', {'idsocio' : $scope.socioSelected.id});					
			});
		
	}

	$scope.dateCompare = function(date){
		if (date == undefined) return 2;
		var toDaY = new Date();
		var myDate = new Date(date);
		if (myDate > toDaY) return 1;
		return 0;
	}

	
});