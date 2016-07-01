geobuilder = (function() {

	var WORKPLACE_DEFAULT_WIDTH = 600;
	var WORKPLACE_DEFAULT_HEIGHT = 480;


	var oldSimpleSelection = false;
	var simpleSelection = false;
	var selection = null;
	var geoApiInitialized = false;
	
	/**	
	 * Contient un layer de dessin pour la digitalisation. Initialisé lors
	 * de la première digit
	 *
	 * @type {[type]}
	 */
	var geoApiDigitizingLayer = null;
	var geoApiDrawControls = {};

	var map = null;

	function byid(id) { return document.getElementById(id); }


	/**
	 * Creates a Ext.Window widget if not exists with the givent constructor
	 * If the window already exists, we set the title if given
	 */
	function getWindowWidget(id, constructor, title) {
		var widget = Ext.getCmp(id);
		if (!widget) {
			widget = constructor(title);
		} else if (title !== void 0) {
			widget.setTitle(title);
		}
		return widget;
	}
	
	function setWidgetContent(wrapperId, url) {
		byid(wrapperId + '_IFRAME').setAttribute('src', url);
	}

	function showWidget(widget, width, height) {
		widget.show();
		if (typeof width !== 'undefined') { widget.setWidth(width); }
		if (typeof height !== 'undefined') { widget.setHeight(height); }
	}

	function hideWidget(widget) {
		widget.hide();
	}

	function setWaitingWidget(wrapperId) {
		byid(wrapperId + '_IFRAME').contentWindow.document.write('Chargement ...');
	}

	/**
	 * Permet d'appeler des fonctions lors de la fermeture de la fiche, ou 
	 * lors de l'ouverture d'une autre fiche
	 *
	 * @type {Array}
	 */
	var featureInfoCleanupSystem = {
		callbacks: [],
		add: function(fn) {
			featureInfoCleanupSystem.callbacks.push(fn);
		},
		run: function(){
			featureInfoCleanupSystem.callbacks.forEach(function(fn){
				try {
					fn();
				} catch (e) {
					console.log('Exception in featureInfoCleanupSystem callback');
					console.error(e);
				}
			});
			featureInfoCleanupSystem.forgetAll();
		},
		forgetAll: function(){
			featureInfoCleanupSystem.callbacks = [];
		}
	};

	/**
	 * Affiche la fiche d'un objet GéoBuilder dans l'iframe ggis_featureInfo
	 * @param  {String}
	 * @param  {Number|String}
	 * @return {void}
	 */
	function showFeatureInfo(featureClass, featureId, cleanupCallback) {
		// À l'ouverture de la fiche, on procède au nettoyage spécifié
		// précédemment
		featureInfoCleanupSystem.run();

		// Chargement du widget
		var ftinfo = getWindowWidget('ggis_featureInfo', GEOR.geobuilder_createCardWindow, "Info");
		setWidgetContent('ggis_featureInfo', Fusion.getFusionURL() + 'cfm/consult.cfm?OBJ='+featureClass+'&ID='+featureId);
		showWidget(ftinfo, 600, 400);
		
		// Si on passe une fonction de rappel pour la fermeture, on l'enregistre
		// et on indique au widget d'exécuter le cleanup lors de la fermeture
		// manuelle (click sur la croix). À chaque fois qu'on ouvre la fiche
		// d'un nouvel objet sans l'avoir fermé, on stack un listener
		// supplémentaire. C'est pour cela qu'on utilise un service
		// featureInfoCleanupSystem qui gère sa propre liste de callbacks. Au
		// pire on appelle X fois le cleanup qui ne fera rien, n'ayant pas de
		// callbacks dans sa liste. On indique single:true sur les listeners
		// afin qu'ils soient quand même nettoyés quand on masque la fiche
		if (cleanupCallback) { 
			featureInfoCleanupSystem.add(cleanupCallback);
			ftinfo.on('hide', featureInfoCleanupSystem.run, {single: true});
		}
	}

	/**
	 * Masque la fiche Géobuilder
	 */
	function hideFeatureInfo() {
		var ftinfo = getWindowWidget('ggis_featureInfo', GEOR.geobuilder_createCardWindow);
		hideWidget(ftinfo);		
		featureInfoCleanupSystem.run();
	}

	/**
	 * Ajoute un message dans la console de débug
	 * @param {String} file Fichier d'appel
	 * @param {String} context Contexte d'appel (fonction, processus, etc.)
	 * @param {String} info Informations à afficher
	 * @param {String} errlevel Niveau d'erreur
	 */
	function addDebug(file, context, info, errlevel) {
		var args = Array.prototype.slice.call(arguments, 0, 3);
		if (console && console[errlevel]) console[errlevel].apply(console, args);
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
		title = title || tr("Workspace");
		// on récup le widget pour changer le titre
		getWindowWidget('ggis_workPlace', GEOR.geobuilder_createWorkplaceWindow, title);
		// on charge le contenu dans l'iframe
		setWidgetContent('ggis_workPlace', Fusion.getFusionURL() + url);
		showWorkPlace(width || WORKPLACE_DEFAULT_WIDTH, height || WORKPLACE_DEFAULT_HEIGHT);
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
		title = title || 'Popup';
		width = width || 600;
		height = height || 400;		
		
		var popup = getWindowWidget('ggis_popup', GEOR.geobuilder_createPopupWindow, title);
		setWidgetContent('ggis_popup', Fusion.getFusionURL() + url, 600, 400);
		showWidget(popup, width, height);		

	}

	/**
	 * Masque le widget popup
	 * @return {void}
	 */
	function hidePopup(){
		var popup = getWindowWidget('ggis_popup', GEOR.geobuilder_createPopupWindow, title);
		hideWidget(popup);
	}

	/**
	 * Retourne le nom de l'objet
	 * @param {String} idObj: identifiant de type d'objet
	 * @return {String}: nom de l'objet
	 */
	function getObjectName(idObj) {
		var url = Fusion.getFusionURL() + 'cfm/q_getBDObjetInfo.cfm?info=NOM_OBJET&obj=' + idObj;
		// Par défaut on donnera juste "Objet CAN" par exemple
		var objectName = 'Objet ' + idObj;
		// En cas de succès on récupèrera le vrai nom
		var onSuccessSync = function(data) {
			if (data && data[0] && data[0].NOM_OBJET) {
				objectName = data[0].NOM_OBJET;
			}
		};
		// en cas d'errreur on gardera le libelle par défaut
		var onError = function(){};
		// on fait une requête synchrone car c'est historiquement attendu par
		// l'application
		var async = false;
		getJSON(url, '', onSuccessSync, onError, async);
		return objectName;
	}

	/**
	 * @param {Number} latitude: coordonnée
	 * @param {Number} longitude: coordonnée
	 * @param {Number} width: facteur de zoom
	 */
	function ZoomEnsemble(latitude, longitude, width){
		position = new OpenLayers.LonLat(longitude, latitude);
		Fusion.getMap().setCenter(position, width);
	}

	/**
	 * Fonction appelée après une opération de digitalisation, pour nettoyer
	 * la couche de dessin.
	 */
	function ClearDigitization() {
		if (geoApiDigitizingLayer) {
			geoApiDigitizingLayer.removeFeatures(geoApiDigitizingLayer.features);
		}
	}

	/**
	 * Renvoie l'objet window contenu dans un iframe, identifié par le nom du
	 * widget
	 * @param  {String} wrapperId Le nom du widget choisi
	 * @return {Window}
	 */
	function getWidgetIframe(wrapperId) {
		return byid(wrapperId + '_IFRAME').contentWindow;
	}

	/**
	 * Affiche la zone de travail avec certaines dimensions.
	 * @param  {Number} width default = WORKPLACE_DEFAULT_WIDTH
	 * @param  {Number} height default = WORKPLACE_DEFAULT_HEIGHT
	 * @return {void}
	 */
	function showWorkPlace(width, height) {
		var winWorkplace = getWindowWidget('ggis_workPlace', GEOR.geobuilder_createWorkplaceWindow, "zone de travail");
		showWidget(winWorkplace, width, height);
	}

	/**
	 * Masque la zone de travail
	 * @return {void}
	 */
	function hideWorkPlace () {
		var winWorkplace = getWindowWidget('ggis_workPlace', GEOR.geobuilder_createWorkplaceWindow, "zone de travail");
		hideWidget(winWorkplace);
	}

	/**
	 * Charge une url dans l'iframe du widget invisible
	 * @param {String} url
	 */
	function setHiddenWidgetContent(url) {
		setWidgetContent('ggis_hiddenWidget', Fusion.getFusionURL() + url);
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
		setWaitingWidget('ggis_workPlace');
		showWorkPlace(width, height);
	}

	/**
	 * Affiche l'URL passée dans la zone de menu correspondant à la
	 * digitalisation
	 * @param {String} url
	 */
	function setDigitContent(url) {
		setWidgetContent('ggis_menu', Fusion.getFusionURL() + url);
	}

	/**
	 * Renvoie le nom de la carte courante
	 * @return {String} Le nom de la carte
	 */
	function getMapName() {
		return Fusion.getMap().name;
	}

	/**
	 * Passe le flag simpleSelection à true en gardant l'ancienne valeur du flag
	 * dans oldSimpleSelection
	 */
	function setSimpleSelect () {
		oldSimpleSelection = simpleSelection;
		simpleSelection = true;
	}


	/**
	 * Définition des fonctions à implémenter par le client (définies dans
	 * ggis_jsFramework)
	 */

	function clearSelection() {
		setCurrentSelection(0, '', '', false);
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
		var success = "err";
		//si le paramètre optionnel isVisSelCtrl n'a pas été transmis ou est différent de false on le définit à true
		if (typeof isVisSelCtrl === 'undefined' || isVisSelCtrl !== false) {
			isVisSelCtrl = true;
		}
		//if (typeof(lstIdObj) != 'undefined' && typeof(lstIds) != 'undefined' && typeof(width) != 'undefined') {
		if (typeof(lstIdObj) != 'undefined' && typeof(lstIds) != 'undefined') {
			if (lstIdObj !== '' && lstIds !== '') { 
				if (!width) {
					width = "";
				}
				else {
					width = String(width);
				}
				var tbIdObj = [];
				tbIdObj = lstIdObj.split(";");
				var tbGroupIds = [];
				tbGroupIds = lstIds.split(";");
				var nbIdObj = tbIdObj.length;
				var nbGroupIds = tbGroupIds.length;
				if (nbIdObj == nbGroupIds) {
					//@todo recuperer la liste des layers
					var lstLayerName = "";
					lstLayerName ='geobuilder'; // valeur par defaut pour test
					addDebug("geobuilder.js", "setCurrentSelection", "lstLayerName =  " + lstLayerName, "debug");
					if (lstLayerName !== "") {
						localise(lstIdObj, lstIds, width);
						setSelection(lstIdObj, lstIds);

						success = "ok";
					}
					else {
						success = "err_layer";
						addDebug("geobuilder.js", "setCurrentSelection", "Aucun element a selectionner (aucune couche visible et selectionnable correspondant aux identifiants d'objets transmis n'a ete trouvee)", "debug");
					}

				}else {
					addDebug("geobuilder.js", "setCurrentSelection", "Aucun traitement effectue: incoherence du nombre d'elements entre lstIdObj ("+nbIdObj+") et lstIds ("+nbGroupIds+" groupes d'ids)", "error");
				}
			} else {
				addDebug("geobuilder.js", "setCurrentSelection", "Aucun traitement effectue: au moins une des listes transmises (lstIdObj ou lstIds) est vide; pb possible de GEOMETRY sur les objets", "error");
			}
		}
		else {
			addDebug("geobuilder.js", "setCurrentSelection", "Aucun traitement effectue: certains parametres d'entree n'ont pas ete transmis", "error");
		}
		return success;
	}


	/**
	 * Zoom on geobuilder object
	 * 	first create feature
	 *  then selected and zoom on it
	 *  
	 *  @param {String} idObj
	 *  @param {String[]} listIds
	 *  @param {Number} width
	 * 
	 */
	function localise(idObj, listIds, width) {
		
		var ids = listIds ? listIds.split(',') : listIds;
		width = width || 0;
		var layername;
		var features = [];
		
		// init layer to  draw selected features
		var map = Fusion.getMap();
		
		var layerOptions = OpenLayers.Util.applyDefaults({}, {
			displayInLayerSwitcher : false,
			sphericalMercator: true
		}) 	;
		
		// retrieve layer
		for (var i=0; i< map.layers.length; i++){
			if (typeof(map.layers[i].params) != 'undefined' && typeof(map.layers[i].params.LAYERS) != 'undefined' && map.layers[i].params.LAYERS.startsWith(idObj)){
				layername = map.layers[i].name;
				layer = map.layers[i].params.LAYERS;
				break;
			}
		}
		if (typeof(layername) === 'undefined'){
			alert("Aucune couche n'est disponible pour l'objet " + idObj);
		}
		var selectionHighlightLayer = new OpenLayers.Layer.Vector("geobuilder", layerOptions);
		map.addLayer(selectionHighlightLayer);

		var selection = JSON.stringify({
			lstIdObj: idObj, 
			lstIds: listIds
		});
		
		getJSON(Fusion.getFusionURL() + 'cfm/api.cfm/georchestra.json', selection, function(data) {
			var coorX = [];
			var coorY = [];
			var feature;
			var point, points, j;
			for (var i=0; i<data.features.length; i++){
				points = [];
				featureGeom = data.features[i].geometry;
				layerProj = data.features[i].projection;
				geometryField =  data.features[i].geometryField;
				idField = data.features[i].idField;
				if (featureGeom.type == "Point"){
					point = projection(featureGeom.coordinates[0], featureGeom.coordinates[1], layerProj);
					coorX.push(point.x);
					coorY.push(point.y);
					feature = new OpenLayers.Feature.Vector(point, {});
				}
				else if(featureGeom.type == "Polygon"){
					featureCoordinates = featureGeom.coordinates;
					for (j=0; j< featureCoordinates.length; j++) {
						point = projection(featureCoordinates[j][0], featureCoordinates[j][1], layerProj);
						coorX.push(point.x);
						coorY.push(point.y);
						points.push(point);
					}
					var ring = new OpenLayers.Geometry.LinearRing(points);
					var polygon = new OpenLayers.Geometry.Polygon([ring]);
					feature = new OpenLayers.Feature.Vector(polygon, {});
				}
				// linestring
				else  {
					featureCoordinates = featureGeom.coordinates;
					for (j=0; j< featureCoordinates.length; j++) {
						point = projection(featureCoordinates[j][0], featureCoordinates[j][1], layerProj);
						coorX.push(point.x);
						coorY.push(point.y);
						points.push(point);
					}
					var line = new OpenLayers.Geometry.LineString(points);
					feature = new OpenLayers.Feature.Vector(line, {});
				}
				features.push(feature);
			}	
			
			// zoom on feature
			var bounds, layerBounds = null;

			if (features && features[0]) {
				bounds = new OpenLayers.Bounds();
				Ext.each(features, function(f) {
					if (f.bounds) {
						bounds.extend(f.bounds);
					} else if (f.geometry) {
						bounds.extend(f.geometry.getBounds());
					}
				});
			} else if (selectionHighlightLayer.features.length) {
				bounds = selectionHighlightLayer.getDataExtent();
			} else {
				return;
			}
			if (!bounds || !bounds.left) {
				return;
			}
			if (bounds.getWidth() + bounds.getHeight() !== 0) {
				layerBounds = bounds.scale(1.05);
				map.zoomToExtent(layerBounds);
			} else if (bounds.getWidth() === 0 && bounds.getHeight() === 0) {
				map.setCenter(bounds.getCenterLonLat());
			}
			
		}, function(status) {
			alert('Something went wrong.');
			console.error('Something went wrong.');
		});

	}
	
	function projection(coorX, coorY, layerProj){
		var point, epsgMap = new OpenLayers.Projection(Fusion.getMap().projection);
		if (layerProj !== ""){
			var projectionCode = 'EPSG:' + layerProj;
			var epsgLayer = new OpenLayers.Projection(projectionCode);
			point = new OpenLayers.Geometry.Point(coorX, coorY).transform(epsgLayer, epsgMap);
		} else {
			point = new OpenLayers.Geometry.Point(coorX, coorY);
		}
		return point;
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

		var layers = [];
		var maplayers = Fusion.getMap().layers;
		for(var i = 0; i < maplayers.length; i++)
		{
			var myLayer = maplayers[i];
			if(myLayer.getVisibility() == visible)
			{
				layers[layers.length] = myLayer;
			}
		}

		return layers;
	}

	/**
	 * renvoie des groupes de couches de la carte
	 * @param {Boolean} visible
	 * @param {Boolean} selectable
	 * @return {Array}
	 */
	function getLayersGroups(visible, selectable) {
		var layers = getLayers(visible, selectable);
		return layers;
	}

	function isDisplayed(layerName)
	{

		return true;
	}
	/**
	 * Obtenir la sélection courante
	 *
	 * @param {String} lstIdObj liste des identifiants d'objets séparés par des ";"
	 * @return {String} selectedObjs liste des objets sélectionnés avec leurs ids (ex: 'CAN 10;CAN 20;CAN 30;INS 2;NDS 1;NDS 3')
	 */
	function getCurrentSelection(lstIdObj) {
		Fusion.getSelection();
	}

	/**
	 * Doit lancer la digitalisation d'un point par l'utilisateur. Doit ensuite
	 * appelerla callback passée avec une chaine WKT représentant ce point.
	 * @param {Function} callback
	 */
	function DigitizePoint(callback) {
		geoApiStartDigitizing('point', callback);
	}


	/**
	 * Doit lancer la digitalisation d'une polyligne par l'utilisateur. Doit
	 * ensuite appelerla callback passée avec une chaine WKT représentant cette
	 * ligne.
	 * @param {Function} callback
	 */
	function DigitizeLineString(callback) {
		geoApiStartDigitizing('linestr', callback);
	}

	/**
	 * Doit lancer la digitalisation d'un polygone par l'utilisateur. Doit
	 * ensuite appelerla callback passée avec une chaine WKT représentant ce
	 * polygone.
	 * @param {Function} callback
	 */
	function DigitizePolygon(callback) {
		geoApiStartDigitizing('polygon', callback);
	}

	function setSelection(idObj, id){
		var myObjSel = {};
		myObjSel[idObj] = id;
		var sel = objetToString(myObjSel);
		Fusion.setSelection(sel);

	}

	function showMap() {
		//hideWorkPlace();
		//hideFeatureInfo();
		Fusion.getMap().baseLayer.redraw();
	}
	
	
	window.Fusion = {
			map : null,
			selection : "CAN 1",
			/**
			 * Renvoie l'URL pointant vers le dossier 'diffos' avec un '/' en fin.
			 * @return {String}
			 */
			getFusionURL: function() {
				return GEOR.config.GEOBUILDER_URL;
			},
 
			getWidgetById: function(id) {
				if (id === 'Map'){
					return window;
				}
				throw new Error('getWidgetById + "'+id+'"');
			},

			getMap: function () {
				this.map = GeoExt.MapPanel.guess().map;
				return this.map;
			},
 
			setSelection: function (select) {
				this.selection = select;
			}, 
			
			getSelection: function() {
				return this.selection;
			}
	};


	/**
	 * Fonctions & Helpers privées
	 */
	function geoApiStartDigitizing(type, user_handler) {
		geoApiInit();
		if (user_handler) {
			var handler = function() {
				user_handler.apply(this,  arguments);
			};
			var control = geoApiDrawControls[type];
			control.userHandler = handler;
			geoApiActiveControl = control;
			control.activate();
		}
	}    	
	
	
	function geoApiInit() {
		if (geoApiInitialized) {
			return;
		}
		var map = Fusion.getMap();
		var geoApiStyleMap = GEOR.util.getStyleMap({"default" : {strokeColor: '#99bbe8', fillColor: "#99bbe8"}, "select" : {strokeColor: '#99bbe8', fillColor: "#99bbe8"}});
		var layerOptions = OpenLayers.Util.applyDefaults({}, {
			styleMap : geoApiStyleMap,
			displayInLayerSwitcher : false,
			sphericalMercator: true
		});
		if (null === geoApiDigitizingLayer) {
			geoApiDigitizingLayer = new OpenLayers.Layer.Vector("geobuilder", layerOptions);
			map.addLayer(geoApiDigitizingLayer);
		}
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
		};

		for(var key in geoApiDrawControls) {
			if (geoApiDrawControls[key].events) {
				geoApiDrawControls[key].events.register('featureadded', null, geoApiCallHandler);
				map.addControl(geoApiDrawControls[key]);
			}
		}
	}

	function geoApiCheckLine(point, geom) {
		if (geom.components.length == 3) {
			console.log('geoApiCheckLine this', this);
			console.log('geoApiCheckLine this.handler', this.handler);
			this.handler.dblclick();
			this.handler.finalize();
		}
	}

	function geoApiCallHandler(evt) {
		var wktWriter = new OpenLayers.Format.WKT();
		this.userHandler(wktWriter.write(evt.feature));
		window.setTimeout(geoApiDeactivate, 100);

		return false;
	}

	function geoApiDeactivate() {
		if (geoApiActiveControl) {
			geoApiActiveControl.deactivate();
			geoApiActiveControl = null;
		}
	}	

	function getMapSrid() {
		return Fusion.getMap().projection.match(/EPSG:([0-9]+)/)[1];
	}

	/*
	 * Conversion d'une sélection sous forme d'objet en sélection sous forme de string
	 */
	function objetToString(selObject) {
		var selString = "";
		for (var cle in selObject) if (selObject.hasOwnProperty(cle)) {
			if (selObject[cle] !== "") {
				var ids = selObject[cle].split(",");
				for (var i=0; i<ids.length; i++) {
					if (selString === "") {
						selString = cle + " " + ids[i];
					}
					else {
						selString = selString + ";" + cle + " " + ids[i];
					}
				}
			}
		}
		return selString;
	}

	function getJSON (url, params, successHandler, errorHandler, async) {
		if (async === void 0) {
			async = true;
		}
		var xhr = (typeof XMLHttpRequest != 'undefined' ? 
					new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP'));
		xhr.open('post', url, async);
		xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
		xhr.setRequestHeader('Content-Length', params.length);
		xhr.onreadystatechange = function() {
			var status;
			var data;
			if (xhr.readyState == 4) { 
				status = xhr.status;
				if (status == 200) {
					data = JSON.parse(xhr.responseText);
					if (successHandler) { successHandler(data); }
				} else {
					if (errorHandler) { errorHandler(status); }
				}
			}
		};
		xhr.send(params);
	}

	function mapRefresh(idObj) {
		Fusion.getMap().layers
			.filter(function(ly){ 
				return ly.params && ly.params.LAYERS && ly.params.LAYERS.startsWith(idObj);
			})
			.forEach(function(ly) {
				ly.redraw(true);	
			});
	}

	/**
	 * Export des fonctions du client dans l'espace global
	 */

	window.addDebug = addDebug;
	window.ClearDigitization = ClearDigitization;
	window.clearSelection = clearSelection;
	window.DigitizeLineString = DigitizeLineString;
	window.DigitizePoint = DigitizePoint;
	window.DigitizePolygon = DigitizePolygon;
	window.getCurrentSelection = getCurrentSelection;
	window.getLayers = getLayers;
	window.getLayersGroups = getLayersGroups;
	window.getMapName = getMapName;
	window.getMapSrid = getMapSrid;
	window.getObjectName = getObjectName;
	window.getWidgetIframe = getWidgetIframe;
	window.hideFeatureInfo = hideFeatureInfo;
	window.hidePopup = hidePopup;
	window.hideWorkPlace = hideWorkPlace;
	window.isDisplayed = isDisplayed;
	window.mapRefresh = mapRefresh;
	window.setCurrentSelection = setCurrentSelection;
	window.setDigitContent = setDigitContent;
	window.setHiddenWidgetContent = setHiddenWidgetContent;
	window.setSimpleSelect = setSimpleSelect;
	window.setWidgetContent = setWidgetContent;
	window.setWorkPlaceContent = setWorkPlaceContent;
	window.showFeatureInfo = showFeatureInfo;
	window.showMap = showMap;
	window.showPopup = showPopup;
	window.showWaitingWorkPlace = showWaitingWorkPlace;
	window.showWorkPlace = showWorkPlace;
	window.ZoomEnsemble = ZoomEnsemble;

}());
