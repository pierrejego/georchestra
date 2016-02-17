Ext.namespace("GEOR");

GEOR.geobuilder_createPopupWindow = function (title) {

	// Traduction
	var tr = OpenLayers.i18n;

	popupWindow = new Ext.Window({
		id: 'geo-window-popup',
		layout: 'fit',
		height: 400,
		width: 500,
		modal: true,
		closeAction: 'hide',
		contentEl: 'ggis_popup',
		buttons: [{
            text: tr('Close'),
            handler: function(){
            	globalElem.popupWindow.hide();
            }
		}]
	});
	popupWindow.show();

};

GEOR.geobuilder_createCardWindow = function (title) {

	// Traduction
	var tr = OpenLayers.i18n;
	
	return globalElem.cardWindow = new Ext.Window({
		id: 'geo-window-featureInfo',
		layout: 'fit',
		height: 400,
		width: 500,
		closeAction: 'hide',
		contentEl: 'ggis_featureInfo',
		buttons: [{
            text: tr('Close'),
            handler: function(){
            	globalElem.cardWindow.hide();
            }
		}]
	}).show();
	
};

GEOR.geobuilder_createWorkplaceWindow = function (title) {

	workplaceWindow = new Ext.Window({
		id: 'geo-window-workplace',
		layout: 'fit',
		title: title,
		height: 400,
		width: 500,
		closeAction: 'hide',
		contentEl: 'ggis_workPlace_IFRAME',
		buttons: [{
            text: 'Close',
            handler: function() {
            	workplaceWindow.hide();
            }
		}]
	});
	return workplaceWindow;
};
