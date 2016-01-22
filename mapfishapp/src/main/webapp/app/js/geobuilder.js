;(function(){

    var WORKPLACE_DEFAULT_WIDTH = 600
    var WORKPLACE_DEFAULT_HEIGHT = 400


    var oldSimpleSelection = false;
    var simpleSelection = false;

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
     * Fonctions & Helpers privées
     */

     var currentSelection = []



    /**
     * Définition des fonctions à implémenter par le client (définies dans
     * l'index)
     */


    /**
     * Affiche la fiche d'un objet GéoBuilder dans l'iframe ggis_featureInfo
     * @param  {String}
     * @param  {Number|String}
     * @return {void}
     */
    function showFeatureInfo(featureClass, featureId) {
        setWidgetContent('ggis_featureInfo', Fusion.getFusionURL() + 'cfm/consult.cfm?OBJ='+featureClass+'&ID='+featureId)
        showWidget('ggis_featureInfo')
    }

    /**
     * Masque la fiche Géobuilder
     */
    function hideFeatureInfo() {
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
        setWidgetTitle('ggis_workPlace', title)
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
        setWidgetTitle('ggis_popup', title)
        setWidgetContent('ggis_popup', Fusion.getFusionURL() + url, width, height)
        showWidget('ggis_popup')

    }

    /**
     * Masque le widget popup
     * @return {void}
     */
    function hidePopup(){
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

    }

    /**
     * Fonction appelée après une opération de digitalisation, pour nettoyer
     * la couche de dessin.
     */
    function ClearDigitization() {

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
        showWidget('ggis_workPlace', width || WORKPLACE_DEFAULT_WIDTH, height || WORKPLACE_DEFAULT_HEIGHT)
    }

    /**
     * Masque la zone de travail
     * @return {void}
     */
    function hideWorkPlace () {
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
        return "NoMap"
    }

    /**
     * Passe le flag simpleSelection à true en gardant l'ancienne valeur du flag
     * dans oldSimpleSelection
     */
    function setSimpleSelect () {
        oldSimpleSelection = simpleSelection;
        simpleSelection = true;
    };



    /**
     * Définition des fonctions à implémenter par le client (définies dans
     * ggis_jsFramework)
     */

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

        // effacement de la sélection sur la carte
        deleteMapSelection(currentSelection)

        var selection = Selection.fromSequences(lstIdObj, lstIds)
        var idsLists = lstIds.split(';') // ["1,2,3", "4,5,6"]
        /* global currentSelection */
        currentSelection = selection.map(function(obj, ids){
            return {obj: obj, ids: ids}
        })

        // sélection sur la carte des nouveaux objets
        addMapSelection(currentSelection)

        // Mise à jour des sélecteurs de fiche
        var objSelect = d3.select('#currentSelectionFeaturesClasses')
        var idsSelect = d3.select('#currentSelectionIds')
        var objOpt = objSelect.selectAll('option')
            .data(currentSelection, function(o){ return o.obj })
        objOpt.exit().remove()
        objOpt.enter().append('option')
        objOpt.text(function(d) {
            return d.obj
        })
        objSelect.on('change', function(){
            var obj = d3.event.target.value
            showIdsSelect({obj: obj, ids: selection.get(obj)})
        })

        function showIdsSelect(subSel) {
            var idsOpt = idsSelect.selectAll('option').data(subSel.ids)
            idsOpt.exit().remove()
            idsOpt.enter().append('option')
            idsOpt.text(function(d){return String(d)})
            idsSelect.on('change', function(){
                showFeatureInfo(subSel.obj, d3.event.target.value)
            })

            showFeatureInfo(subSel.obj, subSel.ids[0])
        }

        showIdsSelect(currentSelection[0])


        // Mise à jour de l'input type text
        d3.select('#text-selection').property('value',
            currentSelection.reduce(function(acc, subSel){
                return acc.concat(subSel.ids.map(function(id){
                    return subSel.obj + ' ' + id
                }))
            }, [])
            .join(';')
        )
        console.log('currentSelection',currentSelection)
        return 'ok'
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
        return []
    }

    /**
     * renvoie des groupes de couches de la carte
     * @param {Boolean} visible
     * @param {Boolean} selectable
     * @return {Array}
     */
    function getLayersGroups(visible, selectable) {
        return []
    }

    /**
     * Obtenir la sélection courante
     *
     * @param {String} lstIdObj liste des identifiants d'objets séparés par des ";"
     * @return {String} selectedObjs liste des objets sélectionnés avec leurs ids (ex: 'CAN 10;CAN 20;CAN 30;INS 2;NDS 1;NDS 3')
     */
    function getCurrentSelection(lstIdObj) {
        var currentSelFull = byid('text-selection').value
        if (lstIdObj && lstIdObj.length) {
            var selection = Selection.fromPairs(currentSelFull)
            var objsToKeep = lstIdObj.split(';')
            return selection.filterClasses(function(obj){
                return objsToKeep.indexOf(obj) !== -1
            }).toPairs()
        } else {
            return currentSelFull
        }
    }

    /**
     * Doit lancer la digitalisation d'un point par l'utilisateur. Doit ensuite
     * appelerla callback passée avec une chaine WKT représentant ce point.
     * @param {Function} callback
     */
    function DigitizePoint(callback) {
        return callback('POINT(0 0)')
    }

    /**
     * Doit lancer la digitalisation d'une polyligne par l'utilisateur. Doit
     * ensuite appelerla callback passée avec une chaine WKT représentant cette
     * ligne.
     * @param {Function} callback
     */
    function DigitizeLineString(callback) {
        return callback('LINESTRING(-1 -1,1 1)')
    }

    /**
     * Doit lancer la digitalisation d'un polygone par l'utilisateur. Doit
     * ensuite appelerla callback passée avec une chaine WKT représentant ce
     * polygone.
     * @param {Function} callback
     */
    function DigitizePolygon(callback) {
        return callback('POLYGON(-1 -1,-1 1,1 1,1 -1,-1 -1)')
    }

    /**
     * Export des fonctions du client dans l'espace global
     */

    window.Fusion = {

        /**
         * Renvoie l'URL pointant vers le dossier 'diffos' avec un '/' en fin.
         * @return {String}
         */
        getFusionURL: function() {
            return this.options.urlGeobuilder
        },

        getWidgetById: function(id) {
            if (id === 'Map') return window
            throw 'getWidgetById + "'+id+'"'
        }
    }

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

    /*
     * setMenuContent est utilisée par menuintra.cfm mais l'affichage des menus
     * peut être implémenté à partir du JSON renvoyé par wmenu.cfm
     */
    window.setMenuContent = setMenuContent
    /*
     * setWidgetContent est utilisée pour le chargement du menu qui implémenté
     * avec un iframe dans cette démo.
     */
    window.setWidgetContent = setWidgetContent

}())