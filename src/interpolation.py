import json
import pandas as pd
from shapely.geometry import shape, Point
from convert import toJson
import numpy as np

import matplotlib
from matplotlib import pyplot
from matplotlib.patches import Circle
from shapely.geometry import Polygon
from descartes.patch import PolygonPatch
from matplotlib.collections import PatchCollection

from scipy.interpolate import Rbf

#Data massaging

def createEmptyMapData():
    """
    Creates a DataFrame with polygones and IDs for all tax zones.
    """
    with open('../data/taxzone.json', 'r') as f:
        taxzones = json.load(f)

    polygons_shape = [shape(feature['geometry']) for feature in taxzones['features']]
    names = [feature['properties']['id'] for feature in taxzones['features']]
    map_data = pd.DataFrame({'poly': polygons_shape, 'id': names})

    return map_data

def checkassigned(json_file, field_name, map_data):

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

        poly_counts.append(counts)

    counts_new = interp(map_data,poly_counts)

    plot(map_data['poly'], poly_counts)
    pyplot.savefig("interppre_disc.pdf")
    pyplot.show()

    plot(map_data['poly'], counts_new)
    pyplot.savefig("interpdone_disc.pdf")
    pyplot.show()

    return map_data

# Looking for nearest neighbors won't work as we will need to reloop for each next nearest neighbor

def interpfail(polys,counts):

    new_counts = counts

    for polygon,i in enumerate(map_data['poly']):
        if counts[i] == 0:
            for polygon_n in map_data['poly']:
                if polygon.equals(polygon_n):
                    pass
                elif polygon.touches(polygon_n):
                    pass


def interp(map_data,counts):
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

    plot_t(x,y,co,grid2)
    ax = pyplot.gca()
    ax.scatter(xz,yz,c="white")
    plot_boundaries(map_data['poly'],counts)
    pyplot.savefig("interppre_cont.pdf")
    pyplot.show()

    #Two obvious options, either mean of all interpolated values within a polygon
    #Other option, find nearest grid point to center of polygon
    #Second option is computationally less expensive and probably easier to implement

    x_new = []
    y_new = []
    counts_new = []

    for i,polygon in enumerate(map_data['poly']):
        #need to remove zeros from list for interpolation
        if counts[i] != 0:
            x_new.append(polygon.centroid.x)
            y_new.append(polygon.centroid.y)
            counts_new.append(counts[i])

        elif counts[i] == 0:
            x_new.append(polygon.centroid.x)
            y_new.append(polygon.centroid.y)

            x_idx = find_nearest(xi,polygon.centroid.x)
            y_idx = find_nearest(yi,polygon.centroid.y)

            counts_new.append(int(grid2[x_idx,y_idx]))


    x_new = np.asarray(x_new)
    y_new = np.asarray(y_new)

    counts_newa = np.asarray(counts_new)

    plot_t(x_new,y_new,counts_newa,grid2)
    plot_boundaries(map_data['poly'],counts)
    pyplot.savefig("interpdone_cont.pdf")
    pyplot.show()

    return counts_newa

def find_nearest(array,value):
    idx = (np.abs(array-value)).argmin()
    return idx

def plot_t(x,y,z,grid):
    fig = pyplot.figure(1, dpi=90)

    ax = fig.add_subplot(111)
    im = ax.imshow(grid, extent=(x.min(), x.max(), y.max(), y.min()),aspect='auto')
    pyplot.colorbar(im)
    ax.scatter(x,y,c=z)
    ax.set_xlim(12.44,12.66)
    ax.set_ylim(55.61,55.74)
    #pyplot.show()

def scipy_idw(x, y, z, xi, yi):
    interp = Rbf(x, y, z, function='linear')
    return interp(xi, yi)

def plot_boundaries(polys,counts):

    ax = pyplot.gca()

    patches = []

    for polygon in polys:

        patch = PolygonPatch(polygon,facecolor='none',edgecolor='#000000', alpha=1.0, zorder=2)

        patches.append(patch)

    N = len(polys)

    colors = np.asarray(counts)

    ax = pyplot.gca()

    #my_cmap = matplotlib.cm.get_cmap('jet')
    #my_cmap.set_under('w')

    p = PatchCollection(patches, alpha=0.3, facecolors='none',edgecolors=("black"))

    #p.set_array(colors)
    ax.add_collection(p)

    ax.set_xlim(12.44,12.66)
    ax.set_ylim(55.61,55.74)


def plot(polys,counts):

    fig = pyplot.figure(1, dpi=90)

    ax = fig.add_subplot(111)

    patches = []

    for polygon in polys:

        patch = PolygonPatch(polygon, facecolor='#6699cc',edgecolor='#000000', alpha=1.0, zorder=2)

        patches.append(patch)

    N = len(polys)

    colors = np.asarray(counts)

    ax = pyplot.gca()

    my_cmap = matplotlib.cm.get_cmap('jet')
    my_cmap.set_under('w')

    p = PatchCollection(patches, alpha=1.0,cmap=my_cmap)
    p.set_clim(vmin=0.01)

    p.set_array(colors)
    ax.add_collection(p)

    ax.set_xlim(12.44,12.66)
    ax.set_ylim(55.61,55.74)
    pyplot.colorbar(p)

map_data = createEmptyMapData()

map_data = checkassigned('../data/trafiktal.json', 'cars', map_data)

#object.touches