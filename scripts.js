// Define color scales for different map layers
function getColor(value, scale) {
    if (scale === 'percentages') {
        return value > 90 ? '#033163' :
               value > 80 ? '#005176' :
               value > 70 ? '#006d83' :
               value > 60 ? '#0b888c' :
               value > 50 ? '#319f90' :
               value > 40 ? '#54b492' :
               value > 30 ? '#78c792' :
               value > 20 ? '#9fd790' :
               value > 10 ? '#c7e490' :
               value > 0 ?  '#f0f094' :
                            '#FFFFFF';
    } else if (scale === 'percentages_2') {
        return value > 60 ? '#033163' :
               value > 40 ? '#005176' :
               value > 20 ? '#54b492' :
               value > 10 ? '#78c792' :
               value > 5 ? '#9fd790' :
               value > 1 ? '#c7e490' :
               value > 0 ?  '#f0f094' :
                            '#FFFFFF';
    } else if (scale === '0-600') {
        return value > 400 ? '#033163' :
               value > 300 ? '#005176' :
               value > 200 ? '#006d83' :
               value > 150 ? '#0b888c' :
               value > 100 ? '#319f90' :
               value > 50 ? '#54b492' :
               value > 30 ? '#78c792' :
               value > 5 ? '#9fd790' :
               value > 1 ? '#c7e490' :
               value > 0 ?  '#f0f094' :
                            '#FFFFFF';
    } else if (scale === '0-1') {
        return value > 1 ? '#033163' :
               value > 0.7 ? '#005176' :
               value > 0.5 ? '#54b492' :
               value > 0.3 ? '#78c792' :
               value > 0.1 ? '#9fd790' :
               value > 0 ? '#c7e490' :
                            '#f0f094';
    }
}

// Function to style the GeoJSON layer
function style(feature, scale) {
    return {
        fillColor: getColor(feature.properties.value, scale),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

// Highlight feature on hover over feature (Country polygon)
function highlightFeature(e) {
    var layer = e.target;
    layer.bindPopup('<b>' + layer.feature.properties.Country_code + '</b><br />value: ' + layer.feature.properties.value).openPopup();
}

// Reset the highlight after moving from feature (Country polygon)
function resetHighlight(e) {
    e.target.closePopup();
}

// Zoom to feature (Country polygon)
function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}

// Attach event listeners to feature (Country polygon)
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

// Add legend for each map layer
function addLegend(layerName, scale) {
    var legend = L.control({ position: 'bottomright' });

    legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend'),
            grades = scale === 'percentages' ? [0, 10, 20, 30, 40, 50, 60, 70, 80, 90] :
                     scale === '0-600' ? [0, 1, 5, 30, 50, 100, 150, 200, 300, 400] :
                     scale === 'percentages_2' ? [0, 1, 5, 10, 20, 40, 60] :
                     scale === '0-1' ? [0, 0.1, 0.3, 0.5, 0.7, 1] : [10];

        // Add legend title for each map layer
        div.innerHTML += '<h4>' + layerName + '</h4>';

        // Loop through density intervals and generate a label with a colored square for each interval
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + getColor(grades[i], scale) + '"></i> ' + grades[i] + '<br>';
        }

        return div;
    };

    return legend;
}

// Initialize the map and set default zoom level
var map = L.map('map').setView([0, 20], 3);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
}).addTo(map);

// Create layer controls and legends for each layer
var layerControl = L.control.layers(null, null, { collapsed: false }).addTo(map);
var activeLayer = null;

function addGeoJsonLayer(url, layerName, scale) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            var geojson = L.geoJson(data, { 
                style: feature => style(feature, scale),
                onEachFeature: onEachFeature
            });

            // Add the layer to the map and the layer control
            layerControl.addOverlay(geojson, layerName);

            // Create the legend for the map layer
            var legend = addLegend(layerName, scale);

            // Show the legend only when the map layer is selected
            map.on('overlayadd', function (eventLayer) {
                if (eventLayer.name === layerName) {
                    if (activeLayer) {
                        map.removeLayer(activeLayer.layer);
                        map.removeControl(activeLayer.legend);
                    }
                    activeLayer = { layer: geojson, legend: legend };
                    legend.addTo(map);
                }
            });

            map.on('overlayremove', function (eventLayer) {
                if (eventLayer.name === layerName) {
                    map.removeControl(legend);
                    activeLayer = null;
                }
            });
        });
}

// Import the geojson map layers
addGeoJsonLayer('data/RO.geojson', 'Research Output [-]', '0-600');
addGeoJsonLayer('data/LCA.geojson', 'Local co-author [%]', 'percentages');
addGeoJsonLayer('data/ACA.geojson', 'African (co-)author [%]', 'percentages');
addGeoJsonLayer('data/LCoA.geojson', 'Local corresponding author [%]', 'percentages_2');
addGeoJsonLayer('data/HRI.geojson', 'Helicopter research index (HRI) [-]', '0-1');
