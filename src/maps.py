import folium
# data json file for the overlay
topo = './data/taxzone.json'
map = folium.Map(location=[55.6761, 12.5683])
map.geo_json(geo_path=topo)
map.create_map(path='cph.html')