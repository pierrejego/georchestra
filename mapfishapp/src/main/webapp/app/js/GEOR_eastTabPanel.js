GEOR.createEastTabPanel = function (layerStore) {

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

	var eastItems = [
		new Ext.Panel({
			// this panel contains the "manager layer" and
			// "querier" components
			id: "east-tabpanel",
			region: "center",
			height: 270, // has no effect when region is
			// "center"
			layout: "card",
			activeItem: 0,
			title: tr("Available layers"),
			split: false,
			collapsible: false,
			collapsed: false,
			// we use hideMode: "offsets" here to workaround this bug in
			// extjs 3.x, see the bug report:
			// http://www.sencha.com/forum/showthread.php?107119-DEFER-1207-Slider-in-panel-with-collapsed-true-make-slider-weird
			//hideMode: 'offsets',
			defaults: {
				border:false
			},
			items: [
				Ext.apply({
				// nothing
				}, GEOR.managelayers.create(layerStore))
			]
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
