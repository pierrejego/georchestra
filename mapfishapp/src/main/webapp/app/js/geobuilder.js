
geobuilder = (function() {

	var WORKPLACE_DEFAULT_WIDTH = 600
	var WORKPLACE_DEFAULT_HEIGHT = 480


	var oldSimpleSelection = false
	var simpleSelection = false
	var selection = null
	var geoApiInitialized = false
	var geoApiDigitizingLayer = null
	var geoApiDrawControls = {}
	var layerProjectionCode = ""

	var map = null

	function byid(id) { return document.getElementById(id) }


	function setWidgetContent(wrapperId, url, width, height) {
		byid(wrapperId + '_IFRAME').setAttribute('src', url)
		var wrapper = byid(wrapperId)
		if (typeof width !== 'undefined') wrapper.style.width = String(width) + 'px'
		if (typeof height !== 'undefined') wrapper.style.height = String(height) + 'px'
	}

	function setWidgetTitle(wrapperId, title) {
		byid(wrapperId).getElementsByTagName('h4').item(0).innerHTML = title
	}

	function showWidget(wrapperId, width, height) {
		var wrapper = byid(wrapperId)
		wrapper.style.display = 'block'
			wrapper.style.position = 'absolute'
				if (typeof width !== 'undefined') wrapper.style.width = String(width) + 'px'
				if (typeof height !== 'undefined') wrapper.style.height = String(height) + 'px'
	}

	function hideWidget(wrapperId) {
		byid(wrapperId).style.display = 'none'
	}

	function setWaitingWidget(wrapperId) {
		byid(wrapperId + '_IFRAME').contentWindow.document.write('Chargement ...')
	}

	var HOSTNAME = '172.16.40.100'

	/**
	 * Affiche la fiche d'un objet GéoBuilder dans l'iframe ggis_featureInfo
	 * @param  {String}
	 * @param  {Number|String}
	 * @return {void}
	 */
	function showFeatureInfo(featureClass, featureId) {
		var winWorkplace = Ext.getCmp('geo-window-featureInfo')
		if (!winWorkplace) {
			winWorkplace = GEOR.geobuilder_createCardWindow("Info")
		}
		winWorkplace.show()
		setWidgetContent('ggis_featureInfo', Fusion.getFusionURL() + 'cfm/consult.cfm?OBJ='+featureClass+'&ID='+featureId, 400, 500)
		showWidget('ggis_featureInfo', 600, 400)
	}

	/**
	 * Masque la fiche Géobuilder
	 */
	function hideFeatureInfo() {
		var winWorkplace = Ext.getCmp('geo-window-featureInfo')
		winWorkplace.hide()
		hideWidget('ggis_featureInfo')
	}

	/**
	 * Ajoute un message dans la console de débug
	 * @param {String} file Fichier d'appel
	 * @param {String} context Contexte d'appel (fonction, processus, etc.)
	 * @param {String} info Informations à afficher
	 * @param {String} errlevel Niveau d'erreur
	 */
	function addDebug(file, context, info, errlevel) {
		var args = Array.prototype.slice.call(arguments, 0, 3)
		console && console[errlevel] && console[errlevel].apply(console, args)
	}

	/**
	 * Charge une page dans l'iframe zone de travail, en redimensionnant cet
	 * iframe si possible.
	 * @param {String} url URL de la page a afficher dans la zone de travail
	 * @param {Number} width Largeur de la fenêtre (du widget / iframe), WORKPLACE_DEFAULT_WIDTH par défaut
	 * @param {Number} height Hauteur widget / iframe, WORKPLACE_DEFAULT_HEIGHT par défaut
	 * @param {String} title Titre affiché sur le widget, "Zone de travail" par défaut
	 *
	 */
	function setWorkPlaceContent(url, width, height, title) {
		title = title || tr("Workspace")
		setWidgetContent('ggis_workPlace', Fusion.getFusionURL() + url, width, height)
		//setWidgetTitle('ggis_workPlace', title)
		showWorkPlace(width, height)

	}


	/**
	 * Charge une page dans l'iframe popup
	 * @param {String} url URL de la page a afficher dans la popup
	 * @param {Number} width Largeur de l' iframe (600 par défaut)
	 * @param {Number} height Hauteur l'iframe (400 par défaut)
	 * @param {String} title Titre affiché sur le widget, "Popup" par défaut
	 * @return {void}
	 */
	function showPopup(url, width, height, title) {
		title = title || 'Popup'
		width = width || 600
		height = height || 400
		var popupWindow = Ext.getCmp('geo-window-popup')
		if (!popupWindow) {
			popupWindow = GEOR.geobuilder_createPopupWindow(title)
		}
		popupWindow.title = title
		popupWindow.show()
		setWidgetContent('ggis_popup', Fusion.getFusionURL() + url, 600, 400)
		showWidget('ggis_popup', 600, 400)

	}

	/**
	 * Masque le widget popup
	 * @return {void}
	 */
	function hidePopup(){
		var winWorkplace = Ext.getCmp('geo-window-popup')
		winWorkplace.hide()
		hideWidget('ggis_popup')
	}

	/**
	 * Charge une page dans l'iframe menu
	 * @param {String} url URL de la page a afficher dans le menu
	 * @param {String} title Titre affiché sur le widget
	 * @return {void}
	 */
	function setMenuContent(url, title) {
		setWidgetTitle('ggis_menu', title)
		setWidgetContent('ggis_menu', Fusion.getFusionURL() + url)
		showWidget('ggis_menu', 400, 500)
	}

	/**
	 * Retourne le nom de l'objet
	 * @param {String} idObj: identifiant de type d'objet
	 * @return {String}: nom de l'objet
	 */
	function getObjectName(idObj) {
		type_obj_id = idObj || 'undefined'
		console.log('getObjectName(' + type_obj_id + ')')
		return 'objet ' + type_obj_id
	}

	/**
	 * @param {Number} latitude: coordonnée
	 * @param {Number} longitude: coordonnée
	 * @param {Number} width: facteur de zoom
	 */
	function ZoomEnsemble(latitude, longitude, width){
		position = new OpenLayers.LonLat(longitude, latitude)
		Fusion.getMap().setCenter(position, width)
	}

	/**
	 * Fonction appelée après une opération de digitalisation, pour nettoyer
	 * la couche de dessin.
	 */
	function ClearDigitization() {
		if (geoApiDigitizingLayer) {
			geoApiDigitizingLayer.removeFeatures(geoApiDigitizingLayer.features)
		}
	}

	/**
	 * Renvoie l'objet window contenu dans un iframe, identifié par le nom du
	 * widget
	 * @param  {String} wrapperId Le nom du widget choisi
	 * @return {Window}
	 */
	function getWidgetIframe(wrapperId) {
		return byid(wrapperId + '_IFRAME').contentWindow
	}

	/**
	 * Affiche la zone de travail avec certaines dimensions.
	 * @param  {Number} width default = WORKPLACE_DEFAULT_WIDTH
	 * @param  {Number} height default = WORKPLACE_DEFAULT_HEIGHT
	 * @return {void}
	 */
	function showWorkPlace(width, height) {
		var winWorkplace = Ext.getCmp('geo-window-workplace')
		if (!winWorkplace) {
			winWorkplace = GEOR.geobuilder_createWorkplaceWindow("zone de travail")
		}
		winWorkplace.show()
		showWidget('ggis_workPlace', width || WORKPLACE_DEFAULT_WIDTH, height || WORKPLACE_DEFAULT_HEIGHT)
	}

	/**
	 * Masque la zone de travail
	 * @return {void}
	 */
	function hideWorkPlace () {
		var winWorkplace = Ext.getCmp('geo-window-workplace')
		winWorkplace.hide()
		hideWidget('ggis_workPlace')
	}

	/**
	 * Charge une url dans l'iframe du widget invisible
	 * @param {String} url
	 */
	function setHiddenWidgetContent(url) {
		setWidgetContent('ggis_hiddenWidget', Fusion.getFusionURL() + url)
	}

	/**
	 * Affiche la zone de travail avec un message de chargement permettant de
	 * soumettre un formulaire avec son iframe comme cible. Il ne faut donc pas
	 * charger une parge de chargement dans l'iframe afin d'éviter une race
	 * condition avec la soumission du formulaire.
	 * @param  {Number} width Largeur de la zone de travail, avec valeur par défaut
	 * @param  {Number} height Hauteur, idem
	 * @return {void}
	 */
	function showWaitingWorkPlace(width, height) {
		setWaitingWidget('ggis_workPlace')
		showWorkPlace(width, height)
	}

	/**
	 * Affiche l'URL passée dans la zone de menu correspondant à la
	 * digitalisation
	 * @param {String} url
	 */
	function setDigitContent(url) {
		setWidgetContent('ggis_menu', Fusion.getFusionURL() + url)
	}

	/**
	 * Renvoie le nom de la carte courante
	 * @return {String} Le nom de la carte
	 */
	function getMapName() {
		return Fusion.getMap().name
	}

	/**
	 * Passe le flag simpleSelection à true en gardant l'ancienne valeur du flag
	 * dans oldSimpleSelection
	 */
	function setSimpleSelect () {
		oldSimpleSelection = simpleSelection
		simpleSelection = true
	}


	/**
	 * Définition des fonctions à implémenter par le client (définies dans
	 * ggis_jsFramework)
	 */

	function clearSelection() {
		setCurrentSelection(0, '', '', false)
	}

	/**
	 * definir la selection courante
	 * @param {String} width largeur du zoom
	 * @param {String} lstIdObj: liste des identifiants d'objets séparés par des ";" (ex: 'CAN;INS')
	 * @param {String} lstIds: liste des groupes d'identifiants associés aux idObj (ex: '1,2,3;4,5')
	 *                         (séparateur "," entre 2 ids d'un même objet - séparateur ";" entre 2 ids d'objets différents)
	 * @param {Boolean} isVisSelCtrl: flag de visibilité sélectionnabilité (paramètre optionnel)
	 *                      false: on force la recherche sur toutes les couches independamment des critères de visibilité sélectionnabilité
	 * @return {String} success: "ok" si le traitement s'est bien passé (on a pu définir la sélection)
	 *                           "err_visibilite" si on n'a pas pu définir de sélection (probablement dû à un pb de visibilite/selectionnabilite des couches)
	 *                           "err_geometry" si le traitement n'a pas abouti en raison d'une GEOMETRY incorrecte (nulle ou non définie) de l'objet
	 *                           "err_layerfilter" : le traitement n'a pas abouti en raison d'un filtre sur les données appliqué sur la(les) couche(s) concernée(s)
	 *                           "err" pour tout autre type d'erreur (erreur dans les paramètres d'entrée)
	 */
	function setCurrentSelection(width, lstIdObj, lstIds, isVisSelCtrl) {
		var success = "err"
		//si le paramètre optionnel isVisSelCtrl n'a pas été transmis ou est différent de false on le définit à true
		if (typeof(isVisSelCtrl) == 'undefined' || isVisSelCtrl != false) {
			isVisSelCtrl = true
		}
		//if (typeof(lstIdObj) != 'undefined' && typeof(lstIds) != 'undefined' && typeof(width) != 'undefined') {
		if (typeof(lstIdObj) != 'undefined' && typeof(lstIds) != 'undefined') {
			if (lstIdObj != '' && lstIds != '') { 
				if (width == null) {
					width = ""
				}
				else {
					width = new String(width)
				}
				var tbIdObj = new Array()
				tbIdObj = lstIdObj.split(";")
				var tbGroupIds = new Array()
				tbGroupIds = lstIds.split(";")
				var nbIdObj = tbIdObj.length
				var nbGroupIds = tbGroupIds.length
				if (nbIdObj == nbGroupIds) {
					//TODO recuperer la liste des layers
					var lstLayerName = ""
					lstLayerName ='geobuilder' // valeur par defaut pour test
						addDebug("geobuilder.js", "setCurrentSelection", "lstLayerName =  " + lstLayerName, "debug")
						if (lstLayerName != "") {
							localise(lstIdObj, lstIds, width)
							setSelection(lstIdObj, lstIds)

							success = "ok"
						}
						else {
							success = "err_layer"
								addDebug("geobuilder.js", "setCurrentSelection", "Aucun element a selectionner (aucune couche visible et selectionnable correspondant aux identifiants d'objets transmis n'a ete trouvee)", "debug")
						}

				}else {
					addDebug("geobuilder.js", "setCurrentSelection", "Aucun traitement effectue: incoherence du nombre d'elements entre lstIdObj ("+nbIdObj+") et lstIds ("+nbGroupIds+" groupes d'ids)", "error")
				}
			} else {
				addDebug("geobuilder.js", "setCurrentSelection", "Aucun traitement effectue: au moins une des listes transmises (lstIdObj ou lstIds) est vide; pb possible de GEOMETRY sur les objets", "error")
			}
		}
		else {
			addDebug("geobuilder.js", "setCurrentSelection", "Aucun traitement effectue: certains parametres d'entree n'ont pas ete transmis", "error")
		}
		return success
	}

	function localise(idObj, id, width) {
		
		// init layer to  draw selected features
		var map = Fusion.getMap()
		var layerOptions = OpenLayers.Util.applyDefaults({}, {
			displayInLayerSwitcher : false,
			sphericalMercator: true
		}) 	
		for (i=0; i< map.layers.length; i++){
			if (map.layers[i].params.LAYERS.startsWith(idObj)){
				layername = map.layers[i].name
				layer = map.layers[i].params.LAYERS
				break
			}
		}
		var geoApiDigitizingLayer = new OpenLayers.Layer.Vector("geobuilder", layerOptions)
		map.addLayer(geoApiDigitizingLayer)
		
		var selection = JSON.stringify({
			lstIdObj: idObj, 
			lstIds: id
		})
		getJSON(Fusion.getFusionURL() + 'cfm/api.cfm/geochestra.json', selection, function(data) {
			var coorX = []
			var coorY = []
			var  features = []
			for (i=0; i<data.features.length; i++){
				points = []
				featureGeom = data.features[i].geometry
				layerProj = data.features[i].projection
				if (featureGeom.type == "Point"){
					var point = projection(featureGeom.coordinates[0], featureGeom.coordinates[1], layerProj)
					coorX.push(point.x)
					coorY.push(point.y)
					feature = new OpenLayers.Feature.Vector(point, {})

				}
				else if(featureGeom.type == "Polygon"){
					featureCoordinates = featureGeom.coordinates
					for ( var j=0; j< featureCoordinates.length; j++) {
						point = projection(featureCoordinates[j][0], featureCoordinates[j][1], layerProj)
						coorX.push(point.x)
						coorY.push(point.y) 
						points.push(point)
					}
					var ring = new OpenLayers.Geometry.LinearRing(points)
					var polygon = new OpenLayers.Geometry.Polygon([ring])
					feature = new OpenLayers.Feature.Vector(polygon, {})
				}
				// linestring
				else  {
					featureCoordinates = featureGeom.coordinates
					for ( var j=0; j< featureCoordinates.length; j++) {
						point = projection(featureCoordinates[j][0], featureCoordinates[j][1], layerProj)
						coorX.push(point.x)
						coorY.push(point.y) 
						points.push(point)
					}
					var line = new OpenLayers.Geometry.LineString(points)
					feature = new OpenLayers.Feature.Vector(line, {})
				}
				features.push(feature)
			}
			geoApiDigitizingLayer.addFeatures(features)
			minX = Math.min.apply(Math, coorX)
			maxX = Math.max.apply(Math, coorX)
			minY = Math.min.apply(Math, coorY)
			maxY = Math.max.apply(Math, coorY)
			var centerX = (minX + maxX)/2
			var newMinX = centerX - (width/2)
			var newMaxX = centerX + (width/2)
			addDebug("geobuilder.js", "setCurrentSelection", "minX=" + newMinX + "minY=" + minY + "maxX=" + newMaxX + "maxY=" + maxY, "debug")
			//var newBound = new OpenLayers.Bounds(newMinX, minY, newMaxX, maxY)
			var newBound =  geoApiDigitizingLayer.getDataExtent()
			Fusion.getMap().zoomToExtent(newBound)

			//TODO retrieve layer name 
			// retreive geometry field
			// construct filter dynamically

        	var record = {
				//"owsURL" :"https://sig-wrs.asogfi.fr/geoserver/wfs",
	    		//"typeName" :"CAN_CANTONS"
	    		"owsURL" : GEOR.config.GEOSERVER_WFS_URL,
	    		"typeName" : layer
        	}
			GEOR.querier.create(layername, record)
			filter = new OpenLayers.Filter.Comparison({
				type: "==",
				// only one matching property is supported in here:
				property: "OBJECTID",
				value: "10"
			})
			//call API (test)
			GEOR.querier.searchFeatures(record, "GEOMETRY", filter)

		}, function(status) {
			alert('Something went wrong.')
		})

	}
	
	function projection(coorX, coorY, layerProj){
		var epsgMap   = new OpenLayers.Projection(Fusion.getMap().projection)
		if (layerProj != ""){
			var projectionCode = 'EPSG:' + layerProj
			var epsgLayer = new OpenLayers.Projection(projectionCode)
			var point = new OpenLayers.Geometry.Point(coorX, coorY).transform(epsgLayer, epsgMap)
		} else {
			var point = new OpenLayers.Geometry.Point(coorX, coorY)
		}
	    return point
	}
	
	function deleteMapSelection(selection) {

	}

	function addMapSelection(selection) {

	}
	
	/**
	 * renvoie des couches de la carte
	 * @param {Boolean} visible
	 * @param {Boolean} selectable
	 * @return {Array}
	 */
	function getLayers(visible, selectable) {

		var layers = new Array()
		var maplayers = Fusion.getMap().layers
		for(var i = 0; i < maplayers.length; i++)
		{
			var myLayer = maplayers[i]
			if(myLayer.getVisibility() == visible)
			{
				layers[layers.length] = myLayer
			}
		}

		return layers
	}

	/**
	 * renvoie des groupes de couches de la carte
	 * @param {Boolean} visible
	 * @param {Boolean} selectable
	 * @return {Array}
	 */
	function getLayersGroups(visible, selectable) {
		var layers = getLayers(visible, selectable)
		return layers
	}

	function isDisplayed(layerName)
	{

		return true
	}
	/**
	 * Obtenir la sélection courante
	 *
	 * @param {String} lstIdObj liste des identifiants d'objets séparés par des ";"
	 * @return {String} selectedObjs liste des objets sélectionnés avec leurs ids (ex: 'CAN 10;CAN 20;CAN 30;INS 2;NDS 1;NDS 3')
	 */
	function getCurrentSelection(lstIdObj) {
		Fusion.getSelection()
	}

	/**
	 * Doit lancer la digitalisation d'un point par l'utilisateur. Doit ensuite
	 * appelerla callback passée avec une chaine WKT représentant ce point.
	 * @param {Function} callback
	 */
	function DigitizePoint(callback) {
		geoApiStartDigitizing('point', callback)
	}


	/**
	 * Doit lancer la digitalisation d'une polyligne par l'utilisateur. Doit
	 * ensuite appelerla callback passée avec une chaine WKT représentant cette
	 * ligne.
	 * @param {Function} callback
	 */
	function DigitizeLineString(callback) {
		geoApiStartDigitizing('linestr', callback)
	}

	/**
	 * Doit lancer la digitalisation d'un polygone par l'utilisateur. Doit
	 * ensuite appelerla callback passée avec une chaine WKT représentant ce
	 * polygone.
	 * @param {Function} callback
	 */
	function DigitizePolygon(callback) {
		geoApiStartDigitizing('polygon', callback)
	}

	function setSelection(idObj, id){
		var myObjSel = {}
		myObjSel[idObj] = id
		var sel = objetToString(myObjSel)
		Fusion.setSelection(sel)

	}
	
	function setLayerProjection(idObj) {
		
		var layer = JSON.stringify({
			lstIdObj: idObj
		})
		var layerProj = ""
		var projectionCode = ""
		getJSON(Fusion.getFusionURL() + 'cfm/api.cfm/geochestra.json', layer, function(data) {
			for (i=0; i<data.features.length; i++){
				layerProj = data.features[i].projection
			}
			if (layerProj != ""){
				projectionCode = 'EPSG:' + layerProj
			}
			this.layerProjectionCode = projectionCode

		}, function(status) {
			alert('Something went wrong.')
		})
	}

	function showMap() {
		//hideWorkPlace()
		//hideFeatureInfo()
		Fusion.getMap().baseLayer.redraw()
	}
	
	
	window.Fusion = {
			map : null,
			selection : "CAN 1",
			/**
			 * Renvoie l'URL pointant vers le dossier 'diffos' avec un '/' en fin.
			 * @return {String}
			 */
			getFusionURL: function() {
				return GEOR.config.GEOBUILDER_URL
			},

			getWidgetById: function(id) {
				if (id === 'Map'){
					return window;
				}
				throw new Error('getWidgetById + "'+id+'"');
			},

			getMap() {
				this.map = GeoExt.MapPanel.guess().map
				return this.map
			},

			setSelection(select){
				this.selection = select
			}, 
			getSelection(){
				return this.selection
			}
	}

	/**
	 * Export des fonctions du client dans l'espace global
	 */

	window.addDebug = addDebug
	window.ClearDigitization = ClearDigitization
	window.DigitizeLineString = DigitizeLineString
	window.DigitizePoint = DigitizePoint
	window.DigitizePolygon = DigitizePolygon
	window.getCurrentSelection = getCurrentSelection
	window.getMapName = getMapName
	window.getObjectName = getObjectName
	window.getWidgetIframe = getWidgetIframe
	window.hideFeatureInfo = hideFeatureInfo
	window.hidePopup = hidePopup
	window.hideWorkPlace = hideWorkPlace
	window.setCurrentSelection = setCurrentSelection
	window.setDigitContent = setDigitContent
	window.setHiddenWidgetContent = setHiddenWidgetContent
	window.setSimpleSelect = setSimpleSelect
	window.setWorkPlaceContent = setWorkPlaceContent
	window.showFeatureInfo = showFeatureInfo
	window.showPopup = showPopup
	window.showWaitingWorkPlace = showWaitingWorkPlace
	window.showWorkPlace = showWorkPlace
	window.getLayers = getLayers
	window.isDisplayed = isDisplayed
	window.getLayersGroups = getLayersGroups
	window.ZoomEnsemble = ZoomEnsemble
	window.showMap = showMap
	window.setLayerProjection = setLayerProjection

	/*
	 * setMenuContent est utilisée par menuintra.cfm mais l'affichage des menus
	 * peut être implémenté à partir du JSON renvoyé par wmenu.cfm
	 */
	window.setMenuContent = setMenuContent;
	/*
	 * setWidgetContent est utilisée pour le chargement du menu qui implémenté
	 * avec un iframe dans cette démo.
	 */
	window.setWidgetContent = setWidgetContent;

	/**
	 * Fonctions & Helpers privées
	 */
	function geoApiStartDigitizing(type, user_handler) {
		geoApiInit()
		if (user_handler) {
			var handler = function() {
				user_handler.apply(this,  arguments)
			}
			var control = geoApiDrawControls[type]
			control.userHandler = handler
			geoApiActiveControl = control
			control.activate()
		}
	}    	
	
	
	function geoApiInit() {
		if (geoApiInitialized) {
			return
		}
		var map = Fusion.getMap()
		var geoApiStyleMap = GEOR.util.getStyleMap({"default" : {strokeColor: '#99bbe8', fillColor: "#99bbe8"}, "select" : {strokeColor: '#99bbe8', fillColor: "#99bbe8"}})
		var layerOptions = OpenLayers.Util.applyDefaults({}, {
			styleMap : geoApiStyleMap,
			displayInLayerSwitcher : false,
			sphericalMercator: true
		}) 	
		var geoApiDigitizingLayer = new OpenLayers.Layer.Vector("geobuilder", layerOptions)
		map.addLayer(geoApiDigitizingLayer)
		geoApiDrawControls = {
			point: new OpenLayers.Control.DrawFeature(geoApiDigitizingLayer,
					OpenLayers.Handler.Point, {
				handlerOptions: {
					layerOptions: {
						styleMap: geoApiStyleMap
					}
				}
			}),
			line: new OpenLayers.Control.DrawFeature(geoApiDigitizingLayer,
					OpenLayers.Handler.Path, {
				handlerOptions: {
					freehandToggle: null,
					freehand: false,
					persist: true,
					style: "default", // this forces default render intent
					layerOptions: {
						styleMap: geoApiStyleMap
					}
				},
				callbacks: {
					'point': geoApiCheckLine
				}
			}),
			linestr: new OpenLayers.Control.DrawFeature(geoApiDigitizingLayer,
					OpenLayers.Handler.Path, {
				handlerOptions: {
					freehand: false,
					persist: true,
					style: "default", // this forces default render intent
					layerOptions: {
						styleMap: geoApiStyleMap
					}
				}
			}),
			rectangle: new OpenLayers.Control.DrawFeature(geoApiDigitizingLayer,
					OpenLayers.Handler.RegularPolygon, {
				handlerOptions: {
					persist: true,
					sides: 4,
					irregular: true,
					style: "default", // this forces default render intent
					layerOptions: {
						styleMap: geoApiStyleMap
					}
				}
			}),
			polygon: new OpenLayers.Control.DrawFeature(geoApiDigitizingLayer,
					OpenLayers.Handler.Polygon, {
				handlerOptions: {
					freehand: false,
					persist: true,
					style: "default", // this forces default render intent
					layerOptions: {
						styleMap: geoApiStyleMap
					}
				}
			}),
			circle: new OpenLayers.Control.DrawFeature(geoApiDigitizingLayer,
					OpenLayers.Handler.RegularPolygon, {
				handlerOptions: {
					persist: true,
					sides: 40,
					irregular: false,
					style: "default", // this forces default render intent
					layerOptions: {
						styleMap: geoApiStyleMap
					}
				}
			})
		}

		for(var key in geoApiDrawControls) {
			if (geoApiDrawControls[key].events) {
				geoApiDrawControls[key].events.register('featureadded', null, geoApiCallHandler)
				map.addControl(geoApiDrawControls[key])
			}
		}
	}

	function geoApiCheckLine(point, geom) {
		if (geom.components.length == 3) {
			this.handler.dblclick()
			this.handler.finalize()
		}
	}

	function geoApiCallHandler(evt) {
		//gestion des projection
		if (layerProjectionCode != "") {
			var in_options = { 'internalProjection': new OpenLayers.Projection(Fusion.getMap().projection), 'externalProjection': new OpenLayers.Projection(layerProjectionCode)}
			wkt = new OpenLayers.Format.WKT(in_options)
			//alert(wkt.write(evt.feature))
		}
		else {
			wkt = new OpenLayers.Format.WKT()
			//alert(wkt.write(evt.feature))
		}
		this.userHandler(wkt.write(evt.feature))
		window.setTimeout(geoApiDeactivate, 100)

		return false;
	}

	function geoApiDeactivate() {
		if (geoApiActiveControl) {
			geoApiActiveControl.deactivate()
			geoApiActiveControl = null
		}
	}	
	/*
	 * Conversion d'une sélection sous forme d'objet en sélection sous forme de string
	 */
	function objetToString(selObject) {
		var selString = ""
			for (var cle in selObject) if (selObject.hasOwnProperty(cle)) {
				if (selObject[cle] != "") {
					var ids = selObject[cle].split(",")
					for (var i=0; i<ids.length; i++) {
						if (selString == "") {
							selString = cle + " " + ids[i]
						}
						else {
							selString = selString + ";" + cle + " " + ids[i]
						}
					}
				}
			}
		return selString
	}

	var getJSON = function(url, params, successHandler, errorHandler) {
		var xhr = typeof XMLHttpRequest != 'undefined'
			? new XMLHttpRequest()
		: new ActiveXObject('Microsoft.XMLHTTP')
			xhr.open('post', url, true)
			xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
			xhr.setRequestHeader('Content-Length', params.length);
			xhr.onreadystatechange = function() {
				var status
				var data
				if (xhr.readyState == 4) { 
					status = xhr.status
					if (status == 200) {
						data = JSON.parse(xhr.responseText)
						successHandler && successHandler(data)
					} else {
						errorHandler && errorHandler(status)
					}
				}
			}
			xhr.send(params)
	}

}())