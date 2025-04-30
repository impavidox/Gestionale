app.controller('libro-socio', function($scope, $rootScope, $stateParams, $route) {
	var affiliazioneOrig = 0;;
	var meseSelected = 1;
	var meseEndSelected = 0;
	$scope.viewlibro = false;
	$scope.tesseraBegin = 1;
	$scope.tesseraEnd = 99999;
	$scope.tipoSelected = 0;;
	$scope.viewSceltaTipo = false;
	$scope.titleLibro = "";
	$scope.headerList = "";
	$scope.fede = "";
	
	$scope.elencoList = [
		{ name: 'Effetivi', code: 1 , hd: 'Tipo di Socio'},
		{ name: 'Tesserati',  code: 2 , hd : 'Tesserato'},
	];

	$scope.date = new Date();
	
	rest('activities/retrieveAffiliazioneForLibro/1').query()
		.$promise.then(function(y){
			$scope.AffiliazioneLibro = y;
			$scope.libroOrigin = { value: $scope.AffiliazioneLibro[0] };
	});

	rest('activities/retrieveAffiliazioneForLibro/0').query()
		.$promise.then(function(y){
			$scope.AffiliazioneSocio = y;
	});


//	rest('params/retrieveMesiAttivita').query()
//	.$promise.then(function(y){
//		$scope.mesiAttivita = y;
//		$scope.meseAtt = { value: $scope.mesiAttivita[0] };
//	});

	$scope.libroOriginSel = function(el){
		affiliazioneOrig = el.id;
	}

	$scope.tipoSel = function(el){
		$scope.tipoSelected = el.code;
		$scope.titleLibro = "Libro Socio " + el.name;
		$scope.headerList = el.hd;
	}

//	$scope.meseAttSel = function(el){
//		meseSelected = el.id;
//	}
//
//	$scope.meseFineSel = function(el){
//		meseEndSelected = el.id;
//	}
	
	$scope.eseguiSearch = function(){
		if ($scope.tipoSelected == 0) {
			// $scope.viewSceltaTipo = true;
			alert('Selezionare il tipo di lista');
		} else {
			$scope.viewSceltaTipo = false;
			console.log("tessera begin:" + $scope.tesseraBegin + " end:" + $scope.tesseraEnd + " tipo:" + $scope.tipoSelected)
			rest('socio/retrieveLibroSocio/' + affiliazioneOrig + '/' + $scope.tesseraBegin + '/' + $scope.tesseraEnd + '/' + $scope.tipoSelected).query()
			.$promise.then(function(y){
				$scope.listSocio = y;
				$scope.viewlibro = true;
			});
		}
		
	}
	 $scope.scopeChange = function(s,v){
		 $scope[s] = v;
	 }

	$scope.updateFedeSelected = function(el){
		$scope.fede = el.descrizione;
	}


	$scope.itemSelected = function(item){
		if ($scope.tipoSelected == 2) {
			$scope.socioSelected = item;
			if ($scope.socioSelected.federazione != null){
				$scope.fede = $scope.socioSelected.federazione;
				var i = 0;
				angular.forEach($scope.AffiliazioneSocio, function(k, v) {
  					if(k.descrizione == $scope.socioSelected.federazione){
  						$scope.socioOrigin = { value: $scope.AffiliazioneSocio[i] };
  					}
  					i++;
  				});			
			}	
				
			else	
				$scope.fede = null;
			$scope.viewUpdate = true;
		}
		
	}
		
	$scope.closeAlert = function(){
		$scope.socioSelected = {};
		$scope.fede = "";
		$scope.viewUpdate = false;
		$route.reload();
	}
  	
  	$scope.save = function(){
  		console.log("federazione :" + $scope.fede);
  		if ($scope.fede == null)
  			$scope.fede = $scope.AffiliazioneSocio[0].descrizione;
  			
		var body = {
    		"id" : $scope.socioSelected.id,
    		"federazione" : $scope.fede
    	}

		var resultUpdate = rest("socio/updateFederazione").save(body);
		resultUpdate.$promise.then(function(result){
			$scope.socioSelected = {};
			$scope.fede = "";
			$scope.eseguiSearch();
			$scope.closeAlert();	
		
		})
		$scope.socioOrigin = {};
		
  	}

	$scope.printLibro = function(){
		console.log("tessera begin:" + $scope.tesseraBegin + " end:" + $scope.tesseraEnd + " tipo:" + $scope.tipoSelected)
		$rootScope.goNewTab('libroSocio', {'affiliazione' : affiliazioneOrig , 'begin' : $scope.tesseraBegin, 'end' : $scope.tesseraEnd, 'tipo' : $scope.tipoSelected});
	}
});