# -*- coding: utf-8 -*-
import json
import pandas as pd
from shapely.geometry import shape, Point
from convert import toJson
import numpy as np
from scipy.interpolate import Rbf

from matplotlib import pyplot

def createEmptyMapData():
    """
    Creates a DataFrame with polygones and IDs for all tax zones.
    """
    with open('../website/data/taxzone.json', 'r') as f:
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
        count_number = 0
        # Loop over all points in the json data.
        for point_count in json_data[['points', 'count']].values:
            point = point_count[0]
            count = point_count[1]
            if polygon.contains(point):
                counts += float(count)
                count_number += 1

        #Implemented sanity check such that a mean of points within a polygon is taken if more than one exist per tax zone
        if single_point_per_zone and counts!=0:
            single_count = counts/count_number
        else:
            single_count = counts
        poly_counts.append(counts)


    interpolated_counts = interp(map_data,poly_counts,field_name)

    # pyplot.hist(interpolated_counts)
    # pyplot.show()

    map_data = pd.merge(map_data,
                        pd.DataFrame({'poly': map_data['poly'],
                                      field_name: interpolated_counts}),
                        on='poly')

    return map_data

def interp(map_data,counts,field_name):

    x = []
    y = []

    xz = []
    yz = []
    for i,polygon in enumerate(map_data['poly']):
        #need to remove zeros from list for interpolation
        if counts[i] != 0:
            x.append(polygon.centroid.x)
            y.append(polygon.centroid.y)
        elif counts[i] == 0:
            xz.append(polygon.centroid.x)
            yz.append(polygon.centroid.y)

    co = filter(lambda dum: dum != 0, counts)

    x = np.asarray(x)
    y = np.asarray(y)

    nx,ny = 50,50

    xi = np.linspace(x.min(), x.max(), nx)
    yi = np.linspace(y.min(), y.max(), ny)

    xim, yim = np.meshgrid(xi, yi)
    xif, yif = xim.flatten(), yim.flatten()

    # Calculate scipy's RBF
    grid2 = scipy_idw(x,y,co,xif,yif)
    grid2 = grid2.reshape((ny, nx))

    #Two obvious options, either mean of all interpolated values within a polygon
    #Other option, find nearest grid point to center of polygon
    #Second option is computationally less expensive and probably easier to implement

    x_new = []
    y_new = []
    interpolated_counts = []

    for i,polygon in enumerate(map_data['poly']):
        #need to remove zeros from list for interpolation
        if counts[i] != 0:
            x_new.append(polygon.centroid.x)
            y_new.append(polygon.centroid.y)
            interpolated_counts.append(counts[i])

        elif counts[i] == 0:
            x_new.append(polygon.centroid.x)
            y_new.append(polygon.centroid.y)

            x_idx = find_nearest(xi,polygon.centroid.x)
            y_idx = find_nearest(yi,polygon.centroid.y)

            interpolated_counts.append(int(grid2[x_idx,y_idx]))

    x_new = np.asarray(x_new)
    y_new = np.asarray(y_new)

    interpolated_counts = np.asarray(interpolated_counts)

    return interpolated_counts

def scipy_idw(x, y, z, xi, yi):
    interp = Rbf(x, y, z, function='linear')
    return interp(xi, yi)

def find_nearest(array,value):
    idx = (np.abs(array-value)).argmin()
    return idx

def writeIndex(map_data, field_name, maximize=True):
    """
    Calculates an index for 'field_name' per tax zone and write to
    """
    ids = map_data['id']
    values = map_data[field_name]

    nominal_weight = 1.0 if maximize else -1.0
    index = values / (nominal_weight * values.max())

    toJson(field_name, pd.DataFrame({'id': ids, 'counts': index}))


def writeOnes(map_data, field_name):
    """
    Calculates an index for 'field_name' per tax zone and write to
    """
    ids = map_data['id']
    values = map_data[field_name]

    index = values / values

    toJson('ones', pd.DataFrame({'id': ids, 'counts': index}))

def writeTotalIndex(map_data):
    """
    Calculates an index for 'field_name' per tax zone and write to
    """
    ids = map_data['id']
    index = [0.0] * len(ids)

    colnames = ['cars', 'bikes', 'ages', 'parking', 'male_singles',
                'female_singles', 'digging', 'freeparking']
    weights = [-0.5, 0.5, 0.1, -0.5, 1.0, 1.0, -1.0, 0.25]
    for colname, weight in zip(colnames, weights):
        values = map_data[colname]

        index += values * (weight / values.max())

    toJson('final', pd.DataFrame({'id': ids, 'counts': index}))


if __name__ == '__main__':
    map_data = createEmptyMapData()

    map_data = addJsonFileToMapData('../data/trafiktal.json', 'cars', map_data, True)
    map_data = addJsonFileToMapData('../data/cykler.json', 'bikes', map_data, True)
    map_data = addJsonFileToMapData('../data/average_age.json', 'ages', map_data, True)
    map_data = addJsonFileToMapData('../data/parkingdata.json', 'parking', map_data)
    map_data = addJsonFileToMapData('../data/male_singles.json', 'male_singles', map_data, True)
    map_data = addJsonFileToMapData('../data/female_singles.json', 'female_singles', map_data, True)
    map_data = addJsonFileToMapData('../data/digging.json', 'digging', map_data)
    map_data = addJsonFileToMapData('../data/poi.json', 'poi', map_data)
    map_data = addJsonFileToMapData('../data/free_parking_places.json', 'freeparking', map_data)

    writeIndex(map_data, 'bikes')
    writeIndex(map_data, 'ages')
    writeIndex(map_data, 'male_singles')
    writeIndex(map_data, 'female_singles')
    writeIndex(map_data, 'poi')
    writeIndex(map_data, 'freeparking')
    writeIndex(map_data, 'cars', maximize=False)
    writeIndex(map_data, 'digging', maximize=False)
    writeIndex(map_data, 'parking', maximize=False)

    writeOnes(map_data, 'cars')

    writeTotalIndex(map_data)
