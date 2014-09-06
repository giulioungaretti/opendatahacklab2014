# -*- coding: utf-8 -*-
import json
import pandas as pd
from shapely.geometry import shape, Point


def createEmptyMapData():
    """
    Creates a DataFrame with polygones and IDs for all tax zones.
    """
    with open('data/taxzone.json', 'r') as f:
        taxzones = json.load(f)

    polygons_shape = [shape(feature['geometry']) for feature in taxzones['features']]
    names = [feature['properties']['id'] for feature in taxzones['features']]
    map_data = pd.DataFrame({'poly': polygons_shape, 'id': names})

    return map_data


def addJsonFileToMapData(json_file, field_name, map_data, single_point_per_zone=False):
    """
    Appends a new column named 'field_name' to map_data. The data is read from json_file.
    Flag single_point_per_zone set True, will only read a single count per polygon.
    """
    # Read the json file
    json_data = pd.io.json.read_json(json_file)
    json_data['points'] = json_data.apply(lambda row: Point(row.coords), axis=1)

    # Loop over all polygons in the map.
    poly_counts = []
    for polygon in map_data['poly']:
        counts = 0
        # Loop over all points in the json data.
        for point_count in json_data[['points', 'count']].values:
            point = point_count[0]
            count = point_count[1]
            if polygon.contains(point):
                counts += float(count)
                if single_point_per_zone:
                    break
        poly_counts.append(counts)
    map_data = pd.merge(map_data,
                        pd.DataFrame({'poly': map_data['poly'],
                                      field_name: poly_counts}),
                        on='poly')

    return map_data


def createIndex(map_data):
    return map_data


if __name__ == '__main__':
    map_data = createEmptyMapData()

    map_data = addJsonFileToMapData('data/trafiktal.json', 'cars', map_data)
    map_data = addJsonFileToMapData('data/cykler.json', 'bikes', map_data)
    map_data = addJsonFileToMapData('data/average_age.json', 'ages', map_data)
    map_data = addJsonFileToMapData('data/parkingdata.json', 'parking', map_data)
    map_data = addJsonFileToMapData('data/male_singles.json', 'male_singles', map_data, True)
    map_data = addJsonFileToMapData('data/female_singles.json', 'female_singles', map_data, True)
    map_data = addJsonFileToMapData('data/digging.json', 'digging', map_data)
    map_data = addJsonFileToMapData('data/poi.json', 'poi', map_data)

    map_index = createIndex(map_data)
