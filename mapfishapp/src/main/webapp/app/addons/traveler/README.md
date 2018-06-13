Traveler ADDON
================

This addon allows users to calcul routes and isochrone through IGN web services.
This addon includes : 
	- BAN geocoder to localize adress
	- Referential elements to find utilities or layer's entity from GeoServer
	- Draw control to freehanding point
	- Elements to params isochrones request
	- Elements to params route request
	- Function to save isochrones geometry to local storage
	- Function to use points geometry from local storage to create many isochrones 

This addon need : 
	- IGN key to use route services
	- IGN key to use isochrone service (often the same key as route service)
	- GeoServer workspace that contains referentials layer
	
authors: @Getanbru and @pjego

The addon original config should look like this:

	{
	        "id": "traveler_0",
	        "name": "Traveler",
	        "enabled": true,
	        "preloaded":false,
	        "title": {
	            "en": "Road measuring",
	            "es": "Camino de medición",
	            "fr": "Mesures routières"
	        },
	        "description": {
	            "en": "Travel Tools",
	            "es": "herramientas de viaje",
	            "fr": "Outils de déplacement"
	        },
	        "options": {}
	}

```

For print purpose, you will need to add this section at the end of config.yaml of georchestra

  #===========================================================================
  A4 itineraire:
  #===========================================================================
    mainPage:
      pageSize: A4
      rotation: true
      landscape: false
      backgroundPdf: 'file://${configDir}/background_A4_portrait.pdf'
      items:
       # Empty item
        - !text
          text: ''
          spacingAfter: 15
        # Map Title
        - !text
          font: Arial
          fontSize: 21
          fontColor: #007EC3
          align: left
          text: '${mapTitle}'
          spacingAfter: 40
        # Map
        - !map
           width: 523
           height: 585
           spacingAfter: 220
        # North arrow
        - !columns
          absoluteX: 535
          absoluteY: 150
          width: 25
          items:
            - !image
              maxWidth: 25
              maxHeight: 31
              url: 'file://${configDir}/Arrow_North_CFCF.svg'
              condition: showNorth
              rotation: '${rotation}'
        # Empty item
        - !text
          text: ''
          spacingAfter: 40
         # Comments
        - !columns
          items:
            - !text
              font: Arial
              fontSize: 12
              fontColor: #626161
              text: '${mapComments}'
   ```           