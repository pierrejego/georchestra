GEOR.geobuilder_createEastTabPanel = function (layerStore) {

	var recenteringItems = [
        Ext.apply({
            title: tr("Cities"),
            tabTip: tr("Recentering on GeoNames cities")
        }, GEOR.geonames.create(layerStore.map)),
        Ext.apply({
            title: tr("Referentials"),
            tabTip: tr("Recentering on a selection of referential layers")
        }, GEOR.referentials.create(layerStore.map, GEOR.config.NS_LOC))
    ];
    if (GEOR.address && GEOR.config.RECENTER_ON_ADDRESSES) {
        recenteringItems.push(Ext.apply({
            title: tr("Addresses"),
            tabTip: tr("Recentering on a given address")
        }, GEOR.address.create(layerStore.map)));
    }

    
	var legendPanel = new GeoExt.LegendPanel({
        layerStore: layerStore,
        border: false,
        defaults: {
            labelCls: 'bold-text',
            showTitle: true,
            baseParams: {
                FORMAT: 'image/png',
                // geoserver specific:
                LEGEND_OPTIONS: [
                    'forceLabels:on',
                    'fontAntiAliasing:true'
                ].join(';')
            }
        },
        autoScroll: true
    });
	
	var eastItems = [	                 
	                 
		new Ext.TabPanel({
			// this panel contains the components for
			// recentering the map
			region: "center",
			id: "east-tabpanel",
			activeTab: 0,
			defaults: {
				frame: false,
				border: false,
				bodyStyle: "padding: 5px"
			},
			items: [Ext.apply({
					id:'layers-panel',
		            title: tr("Available layers"),
		            tabTip: tr("Available layers"),
		        }, GEOR.managelayers.create(layerStore)),
		        Ext.apply({
		        	id:'legend-panel',
		            title: tr("Legend"),
		            tabTip: tr("Legend")
		        }, legendPanel)]
		}),
	                 
		new Ext.TabPanel({
			// this panel contains the components for
			// recentering the map
			region: "south",
			id: "tabs",
			collapseMode: "mini",
			collapsible: true,
			deferredRender: false,
			activeTab: 0,
			hideCollapseTool: true,
			split: true,
			height: 100,
			minHeight: 70,
			maxHeight: 100,
			defaults: {
				frame: false,
				border: false,
				bodyStyle: "padding: 5px"
			},
			items: recenteringItems
		})
	];
	return eastItems;
	
}

GEOR.geobuilder_addGeobuilderTab = function () {

	var eastTabs = Ext.getCmp('east-tabpanel');
	eastTabs.insert(0, {
		id: 'geobuilder-integration-tab',
		title: tr('Geobuilder'),
		iconCls: 'geo-icon',
		contentEl: 'ggis_menu_IFRAME'
	});
	eastTabs.doLayout();
};
