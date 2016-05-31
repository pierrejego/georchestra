Ext.namespace("GEOR");

GEOR.geobuilder_createPopupWindow = function (title) {

	// Traduction
	var tr = OpenLayers.i18n;

	popupWindow = new Ext.Window({
		id: 'geo-window-popup',
		layout: 'fit',
		height: 400,
		width: 500,
		title: title,
		modal: true,
		closeAction: 'hide',
		contentEl: 'ggis_popup_IFRAME',
	});
	return popupWindow;

};

GEOR.geobuilder_createCardWindow = function (title) {

	// Traduction
	var tr = OpenLayers.i18n;
	
	featureWindow = new Ext.Window({
		id: 'geo-window-featureInfo',
		layout: 'fit',
		height: 400,
		width: 500,
		title: title,
		closeAction: 'hide',
		contentEl: 'ggis_featureInfo_IFRAME',
	});
	return featureWindow;
	
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
	});
	return workplaceWindow;
};
