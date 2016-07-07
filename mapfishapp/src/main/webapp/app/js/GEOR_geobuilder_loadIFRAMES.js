Ext.namespace("GEOR");

GEOR.geobuilder_loadIFRAMES = function () {

	// Create all IFRAME wrappers and append IFRAMEs inside each corresponding wrapper.
	// Note that Ext.DomHelper.append is NOT chainable.
	// For example purpose, ggis_menu_IFRAME's src attribute is manually set so that the IFRAME is loaded.
	// ggis_hiddenWidget IFRAME.
	Ext.DomHelper.append(document.body, {
		tag: 'div',
		cls: 'iframe-wrapper',
		id: 'ggis_hiddenWidget',
		css: 'display:none;'
	});
	Ext.DomHelper.append(document.getElementById('ggis_hiddenWidget'), {
        tag : 'iframe',
        id: 'ggis_hiddenWidget_IFRAME',
        name: 'ggis_hiddenWidget_IFRAME',
        frameBorder : 0,
        width : 0,
        height : 0,
        css : 'display:none;visibility:hidden;height:0px;',
        src : ''
    });


	// Geobuilder floating windows

	Ext.DomHelper.append(document.body, {
        tag : 'iframe',
        id: 'ggis_featureInfo_IFRAME',
        name: 'ggis_featureInfo_IFRAME',
        frameBorder : 0,
        width : '100%',
        height : '100%',
        css : 'display:none;visibility:hidden;height:0px;',
        src : ''
    });

	Ext.DomHelper.append(document.body, {
		tag : 'iframe',
		id: 'ggis_workPlace_IFRAME',
		name: 'ggis_workPlace_IFRAME',
		frameBorder : 0,
		width : '100%',
		height : '100%',
		css : 'display:none;visibility:hidden;height:0px;',
		src : ''
	});

	Ext.DomHelper.append(document.body, {
        tag : 'iframe',
        id: 'ggis_popup_IFRAME',
        name: 'ggis_popup_IFRAME',
        frameBorder : 0,
		width : '100%',
		height : '100%',
        css : 'display:none;visibility:hidden;height:0px;',
        src : ''
    });

};
