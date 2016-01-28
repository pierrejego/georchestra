GEOR.geobuilder_addGeobuilderTab = function () {

	var eastTabs = Ext.getCmp('east-tabpanel');
	eastTabs.insert(0, {
		id: 'geobuilder-integration-tab',
		title: tr('Geobuilder'),
		iconCls: 'geo-icon',
		contentEl: 'ggis_menu_IFRAME'
	});
	if (Ext.get('ggis_menu_IFRAME') == null){
		Ext.DomHelper.append(document.body, {
			tag: 'div',
			cls: 'iframe-wrapper',
			id: 'ggis_menu',
			css: 'display:none;'
		});
		Ext.DomHelper.append(document.getElementById('ggis_menu'), {
	        tag : 'iframe',
	        id : 'ggis_menu_IFRAME',
	        frameBorder : 0,
	        css : 'display:none;visibility:hidden;height:0px;',
	        src : ''
	    });
	}
	Ext.get('ggis_menu_IFRAME').dom.height = Ext.getCmp('east-tabpanel').getInnerHeight();
	eastTabs.doLayout();
};

GEOR.geobuilder_destroyGeobuilderTab = function () {
	var eastTabs = Ext.getCmp('east-tabpanel');
	eastTabs.remove('geobuilder-integration-tab');
	
	eastTabs.doLayout();
};
