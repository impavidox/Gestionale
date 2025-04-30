app.controller('parametri', function($scope) {
	$scope.viewCommune = false;
	$scope.viewAttivita = true;
	$scope.viewAttivitaList = false;
	$scope.viewCreateAttivita = false;
	$scope.viewSceltaAtt = false;
	$scope.viewNumeroTessera = false;
	$scope.tipoAggiorn = "";
	
	
	$scope.data= rest('params/retrieveParameters').query();
	$scope.families= rest('activities/retrieveFamilies').query();

	$scope.statusLib = {
		0 : 'chiuso',
		1 : 'aperto'
	}
	var familyS = 0;
	$scope.searchCommune = function(){
		console.log('searchCommune is setted...')
		$scope.viewCommune = true;
		$scope.viewAttivita = false;
		$scope.viewAttivitaList = false;
		$scope.viewCreateAttivita = false;
		$scope.viewSceltaAtt = false;
		$scope.viewNumeroTessera = false;
		$scope.viewUpdateNumero=false;
	}
	$scope.attivita = function(){
		console.log('Attivita is setted...')
		$scope.viewCommune = false;
		$scope.viewAttivita = true;
		$scope.viewCreateAttivita = false;
		$scope.viewSceltaAtt = false;
		$scope.viewNumeroTessera = false;
		$scope.viewUpdateNumero=false;
	}
	$scope.numeroTessera = function(){
		$scope.viewCommune = false;
		$scope.viewAttivita = false;
		$scope.viewCreateAttivita = false;
		$scope.viewSceltaAtt = false;
		$scope.viewNumeroTessera = true;
		$scope.viewUpdateNumero=false;
		rest('utility/loadNumeroTessera').get();
	}
	$scope.reloadCommunes = function(){
		console.log('reload communes...');
		rest('geographic/rebuildCommunes'   ).get();
	}

	$scope.reloadStates = function(){
		console.log('reload states...');
		rest('geographic/rebuildStates'   ).get();
	}

	
	$scope.famigliaSel = function (el){
		$scope.famigliaSelSelected = el.id;
//		console.log('famiglia:' + $scope.famigliaSelSelected)
		rest('activities/retrieveFullActivitiesByFamily/' + $scope.famigliaSelSelected  ).query()
			.$promise.then(function(result){
				$scope.viewAttivitaList = true;
				$scope.viewCreateAttivita = false;
				$scope.activitiesList = result;
			});
	}
	$scope.decodeAffiliazione = function(l,t){
		var rc = false;
		l.forEach(function(k) {
			if (k.id == t){
				rc = true;
			} 
		});
		return rc;
	}
	$scope.selectNCommune = function(){
		$scope.dataCommune = rest('geographic/retrieveCommuneByName/' + $scope.nomecommune  ).query()
	}
	
	$scope.createAttivita = function(){
		$scope.viewAttivita = false;
		$scope.viewCreateAttivita = true;
		$scope.viewSceltaAtt = false;
		$scope.tipoAggiorn = "C";
	}
	$scope.chiudiCreateAttivita = function(){
		$scope.viewAttivita = true;
		$scope.viewCreateAttivita = false;
		$scope.viewSceltaAtt = false;		
	}
	$scope.closeAlert = function() {
	    $scope.viewSceltaAtt = false;			
	}

	$scope.itemSelected = function(item){
		$scope.viewSceltaAtt = true;
		$scope.attivitaToUpdate = item;

	}
	
	$scope.updAttiv = function(){
		$scope.descriptionCreate = $scope.attivitaToUpdate.description;
		$scope.libertas = $scope.decodeAffiliazione($scope.attivitaToUpdate.affiliazioneList,1);
		$scope.fgi = $scope.decodeAffiliazione($scope.attivitaToUpdate.affiliazioneList,2);
		$scope.fita = $scope.decodeAffiliazione($scope.attivitaToUpdate.affiliazioneList,3);
		$scope.filkjm = $scope.decodeAffiliazione($scope.attivitaToUpdate.affiliazioneList,4);
		
		$scope.famigliaC = {value :  $scope.families[ $scope.famigliaSelSelected] }
		familyS =  $scope.famigliaSelSelected;
		$scope.viewAttivita = false;
		$scope.viewCreateAttivita = true;
		$scope.viewSceltaAtt = false;
		$scope.tipoAggiorn = "U";
	}
	
	$scope.famigliaCSel = function(el){
		familyS = el.id;
	}
	$scope.createnewAttivita = function(){
		console.log('>>> famigli attivita:' + familyS + '/' + $scope.famigliaSelSelected);
		var l = ($scope.libertas == undefined) ? false : $scope.libertas;
		var f = ($scope.fgi == undefined) ? false : $scope.fgi;		
		var fita = ($scope.fita == undefined) ? false : $scope.fita;		
		var filkjm = ($scope.filkjm == undefined) ? false : $scope.filkjm;
		
		
		var body = {
			'familyId' : familyS,
			'description' : $scope.descriptionCreate ,
			'libertas' : l ,
			'fgi' : f,
			'fita' : fita ,
			'filkjm' : filkjm
		}
		if ($scope.tipoAggiorn == 'U') body.attId = $scope.attivitaToUpdate.id;
		
		rest("activities/updateActivity").save(body)
			.$promise.then(function(r){
				if (r.rc) alert('Attivita aggiornata');
			});
		
		
	}
	
	
	$scope.chiudiCreateAttivita = function(){
//		console.log('chiudiCreateAttivita >>> fam:' + $scope.famigliaSelSelected)
		$scope.viewAttivita = true;
		$scope.viewAttivitaList = true;
		$scope.viewCreateAttivita = false;
		if ($scope.tipoAggiorn = "U")
			rest('activities/retrieveFullActivitiesByFamily/' + $scope.famigliaSelSelected  ).query()
			.$promise.then(function(result){
				$scope.activitiesList = result;
			});
	}
	$scope.removeAttiv = function(){
		$scope.viewSceltaAtt = false;
		var body = {
				'attId' : $scope.attivitaToUpdate.id
		}
		rest("activities/removeActivity").save(body)
		.$promise.then(function(r){
			if (r.rc) {
				alert('Attivita cancellata');
				rest('activities/retrieveFullActivitiesByFamily/' + $scope.famigliaSelSelected  ).query()
				.$promise.then(function(result){
					$scope.activitiesList = result;
				});
			}
		});

	}
	
	$scope.selectNTessera = function(){
		console.log('>>>>>> numero tessera:' + $scope.numeroTesseraSearch)
		$scope.listAbbo = rest('utility/retrieveAbbonamentoByTessera/' + $scope.numeroTesseraSearch ).query();
	}
	
	$scope.abboSelected = function(r){
		$scope.aS = r;
		$scope.numeroTesseraUpd = r.numeroTessera;
		$scope.updCtr = false;
		$scope.updEmpty = true;
		$scope.viewUpdateNumero=true;
	}
	
	$scope.updNTessera = function(){
		console.log('>>> numero tessera:' + $scope.numeroTesseraUpd + " upd:" + $scope.updCtr + ' id:' + $scope.aS.id)
		var body = {
			'id' : $scope.aS.id,
			'extend' : $scope.updCtr,
			'emtpy' : $scope.updEmpty,
			'tessera' : $scope.numeroTesseraUpd
		}
		rest("utility/updateNumeroTessera").save(body)
		.$promise.then(function(r){
			if (r.rc) {
				$scope.listAbbo = rest('utility/retrieveAbbonamentoByTessera/' + $scope.numeroTesseraSearch ).query();
				$scope.viewUpdateNumero=false;
			} else 
				$scope.msgError = r.message;
		});
		
	}
	
	 $scope.scopeChange = function(s,v){
		 $scope[s] = v;
	 }

});