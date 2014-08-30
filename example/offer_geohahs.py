'''
creates csv for choropleth containing the offer view count
for a certain offer keyword i.e. okologisk/ol in every geohahs/zip code id.
'''

import json
from shapely.geometry import Point, Polygon
import geohash
import pandas as pd

# ########## load Json ###########
INPUT_PATH = 'dk.json'
json_string = open(INPUT_PATH).read()
json_data = json.loads(json_string)
polygons = [feature['geometry']['coordinates'][0]
            for feature in json_data['features']]
names = [feature['properties']['POSTNR'] for feature in json_data['features']]
# store shapely poligons
polygons_shape = [Polygon(polygon) for polygon in polygons]
# save just polygons and posnmubers
map_df = pd.DataFrame({'poly': polygons_shape, 'names': names})

# ######### read offers ##############
df = pd.io.parsers.read_table('../data/mappings/offers.csv')
# pattern of  semantic string for heading, brands mostly
pttrn = ['Carlsberg', 'tuborg', 'harboe', 'danske pilsner', 'ale']
ids = df[df.heading.str.contains('|'.join(pttrn))].id.values
# read geoahses and id
geo_offers = pd.read_csv(
    '../data/mappings/geohash.csv', names=['id', 'idd', 'geohash'])
geo_off_crit = geo_offers[geo_offers.idd.isin(ids)]
# should now be super fast to do point poly check
# longitude, latitude  in geojson polygon
geo_off_crit['lat'] = [geohash.decode(i)[0] for i in geo_off_crit.geohash]
geo_off_crit['lon'] = [geohash.decode(i)[1] for i in geo_off_crit.geohash]


def get_points(row):
    return Point([row.lon, row.lat])

geo_off_crit['points'] = geo_off_crit.apply(get_points, axis=1)


def do(row):
    return len(filter(row.poly.contains, geo_off_crit.points))


map_df['counts'] = map_df.apply(do, axis=1)
map_df[['names', 'counts']].to_csv('data.csv', header=['key', 'count'])
