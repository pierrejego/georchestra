Ext.namespace("GEOR");

(function(){
	

/**
 * if the x or y positions are negative, we set them to 0, to prevent the window header
 * from being inaccessible with the mouse.
 * We use setPagePosition, which fires the move event and calls the function again, 
 * but these calls are filtered out because we set x and y to be 0 at least.
 */
function onWidgetMove(widget, x, y) {	
	if (x < 0 || y < 0) {		
		widget.setPagePosition(Math.max(x, 0), Math.max(y, 0));
	} 
}


var commonListeners = {
	move: onWidgetMove 
}

	
GEOR.geobuilder_createPopupWindow = function (title) {

	// Traduction
	var tr = OpenLayers.i18n;

	popupWindow = new Ext.Window({
		id: 'ggis_popup',
		layout: 'fit',
		height: 400,
		width: 500,
		title: title,
		modal: true,
		closeAction: 'hide',
		contentEl: 'ggis_popup_IFRAME',
		listeners: commonListeners,
	});
	return popupWindow;

};

GEOR.geobuilder_createCardWindow = function (title) {

	// Traduction
	var tr = OpenLayers.i18n;
	
	featureWindow = new Ext.Window({
		// id: 'geo-window-featureInfo',
		id: 'ggis_featureInfo',
		layout: 'fit',
		height: 400,
		width: 500,
		title: title,
		closeAction: 'hide',
		contentEl: 'ggis_featureInfo_IFRAME',
		listeners: commonListeners,
	});
	return featureWindow;
	
};

GEOR.geobuilder_createWorkplaceWindow = function (title) {

	workplaceWindow = new Ext.Window({
		id: 'ggis_workPlace',
		layout: 'fit',
		title: title,
		height: 400,
		width: 500,
		closeAction: 'hide',
		contentEl: 'ggis_workPlace_IFRAME',
		listeners: commonListeners,
	});
	return workplaceWindow;
};

}());