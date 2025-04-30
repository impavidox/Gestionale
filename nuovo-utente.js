app.controller('nuovo-utente', function($scope, $rootScope) {

	var birthMM;
	var birthProv;
	var birthCommune;
	var birthCode;
	var resProv;
	var resCommune;
	var tipoSocio = 1;
	var compet;
	var feder;
	
	$scope.pageTitle = 'Creazione nuovo socio';
	$scope.pageMode  ='C';
	$scope.privacy = true;
	$scope.viewFede = false;
	$scope.defaultProvince = 0;
	
	$scope.viewAlert = false;	
	$scope.viewAlert1 = false;	
	$scope.viewError = false;
	$scope.viewAbo = false;
	$scope.viewContinue = false;
	
  	$scope.showRicevuta = false;	
  	$scope.tessNumber = '...';

	$scope.listProvNascita = rest('geographic/retrieveProvince').query();
	$scope.listProv = rest('geographic/retrieveProvince').query();
	$scope.socioCreated = {};
	
	$scope.listTipiSocio = rest('socio/retrieveTipoSocio').query();
	$scope.listTipiSocio.$promise.then(function(result){
		var idx = 0;
		result.forEach(function(x){
			if (x.tipoId == 3) $scope.selectedTipo = { value: x };
			$scope.viewFede = true;
			tipoSocio = 3;
			idx++;
		});
	});
	
	rest('activities/retrieveAffiliazioneForLibro/0').query()
		.$promise.then(function(y){
			$scope.AffiliazioneLibro = y;
			$scope.libroOrigin = { value: $scope.AffiliazioneLibro[0] };
	});
	
	
	$scope.listComm = [];
	$scope.listCommRes = [];
	
	$scope.sessoArray = [
	        {id: 1, name: 'Maschio'},
	        {id: 2, name: 'Femmina'},
	];
	
	$scope.selectedSesso = { value: $scope.sessoArray[0] };
	
	
	    
    $scope.mmvalue = [
    	{label:"Gennaio", id:"01"}, 
		{label:"Febbraio", id:"02"}, 
		{label:"Marzo", id:"03"}, 
		{label:"Aprile", id:"04"}, 
		{label:"Maggio", id:"05"}, 
		{label:"Giugno", id:"06"}, 
		{label:"Luglio", id:"07"}, 
		{label:"Agosto", id:"08"}, 
		{label:"Settembre", id:"09"}, 
		{label:"Ottobre", id:"10"}, 
		{label:"Novembre", id:"11"}, 
		{label:"Dicembre", id:"12"}
	];

	$scope.cnntrlCreate = function(){
		if (tipoSocio == 3)
			if (feder == null) {
				$scope.viewAlert1 = true;	
			} else {
				$scope.create();
			}
							
		
		else {
			$scope.viewAlert = true;			
		}	
	
	} 
    
    $scope.create = function(){
    	$scope.viewAlert = false;
    	$scope.viewAlert1 = false;
    
    	console.log('nome:' + $scope.nome + ", cognome:" + $scope.cognome + ",sesso:" + $scope.selectedSesso.value.id);
    	console.log('Birthday = ' + $scope.birthJJ + '-' +birthMM + '-' + $scope.anno)	
     	console.log('Birthday = ' + birthProv + ' / ' + birthCommune)	
       	console.log('Residence = ' + resProv + ' / ' + resCommune	+ ' address:' + $scope.address + '/' + $scope.cap)
    	console.log('tipo socio = ' + tipoSocio + ' ceritica:' + $scope.certifica + ' competition:' + $scope.competition)
    	console.log('federazione = ' + feder )
    	compet = false;
    	
    	if ($scope.competition != undefined) compet = $scope.competition;
       	if ($scope.privacy == undefined) $scope.privacy = $scope.socioSelected.privacy;
    	if (controlParameters()){
            var body = {
        			"nome" :  $scope.nome.toUpperCase(),
        			"cognome" : $scope.cognome.toUpperCase(),
        			"sesso" : $scope.selectedSesso.value.id,
        			"birthday" :  $scope.birthJJ + '-' +birthMM + '-' + $scope.anno,
        			"birthProv" : birthProv ,
        			"birthCommune" : birthCommune ,
        			"birthCommuneCode" : birthCode ,
        			"resProv" : resProv ,
        			"resCommune" : resCommune ,
        			"address" : $scope.address ,	
        			"cap" : $scope.cap ,	
        			"tipoSocio" : tipoSocio ,	
        			"certifica" :  ($scope.certifica == undefined) ? null : buildDate($scope.certifica) ,	
        			"competition" :compet ,
        			'telefono' : ($scope.telefono == undefined) ? null : $scope.telefono ,
        		   	'email' : ($scope.email == undefined) ? null : $scope.email ,
        	     	'privacy' : $scope.privacy,
        	     	'federazione' : feder	  			
        	};
        	
        	var resultAna = rest("socio/createSocio").save(body);
        	resultAna.$promise.then(function(result){
        		$scope.viewAbo = result.returnCode;
        		if (!result.returnCode) alert(result.message);
        		$scope.socioCreated = result.socio;
        	});
        	
    	} else {
    		alert('Tutti parametri non sono stati compilati');
    	}
    	
    }
    
    $scope.chiudiClient = function(){
    	console.log('>>> chiudiClient')
    	$scope.cognome = null;
      	$scope.nome = null;
    }
    
    function controlParameters(){
    	if ($scope.nome == undefined) return false;
      	if ($scope.cognome == undefined) return false;
    	if ($scope.birthJJ == undefined) return false;
    	if (birthMM == undefined) return false;
    	if (birthProv == undefined) return false;
    	if (birthCommune == undefined) return false;
       	if (resProv == undefined) return false;
       	if (resCommune == undefined) return false;
       	if ($scope.anno == undefined) return false;
    	if ($scope.address == undefined) return false;
    	if ($scope.cap == undefined) return false;
    	return true;
    }
    
    function controlAbbonemanto(){
    	if ($scope.dateInscr == undefined) return false;
    	return true;
    }
    $scope.changeTessNumber = function(){
    }
    $scope.createabo = function(){
       	console.log('>> createabo <<<');
		if (controlAbbonemanto()){
	       	var body = {
				"idSocio" : $scope.socioCreated.id,
				"idAbonamento" : 0,
				"dateInscription" : buildDate($scope.dateInscr),
				"idAnno" : $rootScope.annoSportiva.id,
				"firmato" : ($scope.abbFirmato == undefined) ? false : $scope.abbFirmato , 
			}
	       	var resultAbo = rest("abbonamento/updateAbonamento").save(body);
	       	resultAbo.$promise.then(function(result){
        		$scope.viewAbo = result.returnCode;
        		if (!result.returnCode) alert(result.message);
        		else {
        			$scope.tessNumber = result.abbonamento.numeroTessara;
        			$scope.viewContinue = true;
        		}
        		
        	});
	       	
		} else {
			alert('Data di inscrizione non valida (gg/mm/aaaa)');
		}
    	
    	//$scope.showRicevuta = true;	
    	//console.log('>> after:' + $scope.showRicevuta)
    	   
    }
    
    
    
    $scope.closeAlert = function() {
       	$scope.viewContinue = false;			
	}
	
	$scope.closeControl = function() {
       	$scope.viewAlert = false;			
	}

	$scope.closeControl1 = function() {
       	$scope.viewAlert1 = false;			
	}
	
    $scope.ricevuta = function(){
    	console.log('execute ricevuta...');
    	$rootScope.goNewTab('ricevuta', {'idsocio' : $scope.socioCreated.id , 'reprint' : 0});
    }
 
    $scope.runScheda = function(){
    	console.log('execute runScheda...');
    	$rootScope.goNewTab('scheda', {'idsocio' : $scope.socioCreated.id});
    }
 
 
    $scope. birthMMS= function(el){
    	birthMM = el.id;
    }
    $scope. provNascitaSelected= function(el){
    	$scope.listCommNascita = rest('geographic/retrieveCommune/' + el.code).query();
    }
    $scope.provResSelected = function(el){
      	$scope.listCommRes = rest('geographic/retrieveCommune/' + el.code).query();
    }
    $scope.communeNascitaSelected = function(el){
    	birthCommune = el.description;
    	birthProv = el.provCode
    	birthCode = el.code;
    }
    $scope.communeResSelected = function(el){
    	resCommune = el.description;
    	resProv = el.provCode
    }
    $scope.tipoSocioSelected= function(el){
    	console.log('tipo socio:' + el.id  )
    	tipoSocio = el.id;
    	$scope.viewFede = false;
    	if (el.id == 3){
    		$scope.viewFede = true;
    	}
    }


	$scope.fedeSelected = function(el){
 	  	console.log('fede:' + el.descrizione  )
 		feder = el.descrizione;
 	}
 	

	function buildDate(myDate){
		var r = null;
		if (myDate != undefined ) {
			var w =  new Date(myDate)
			r =  w.getDate()  +  '-' +( w.getMonth() +1)  + '-' + w.getFullYear(); 
		}
		return r;
	}
	 $scope.scopeChange = function(s,v){
		 $scope[s] = v;
	 }

});