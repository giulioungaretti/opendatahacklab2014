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

    # counts_new = interp(map_data,poly_counts,field_name)

    # kde_withkernels(poly_counts)

    plot(map_data['poly'], poly_counts)
    pyplot.savefig("interppre_disc"+str(field_name)+".pdf")
    pyplot.show()

    # pyplot.hist(poly_counts)
    # pyplot.show()
    # plot(map_data['poly'], counts_new)
    # pyplot.savefig("interpdone_disc_"+str(field_name)+".pdf")
    # pyplot.show()

    return map_data


def kde_withkernels(data):

    from scipy import stats

    # Draw the rug and set up the x-axis space

    xx = np.linspace(np.amin(data), np.amax(data), 396)

    # Compute the bandwidth of the kernel using a rule-of-thumb
    #bandwidth = ((4 * np.std(data) ** 5) / (3 * np.shape(data)[0])) ** .2
    #bandwidth = np.shape(data)[0] ** (-1. / 5)
    bandwidth = (np.amax(data)-np.amin(data))/100

    # We'll save the basis functions for the next step
    kernels = []

    # Plot each basis function
    for d in data:

        # Make the basis function as a gaussian PDF
        kernel = stats.norm(d, bandwidth).pdf(xx)
        kernels.append(kernel)

        # Scale for plotting
        kernel /= kernel.max()
        kernel *= .4
        pyplot.plot(xx, kernel, "#888888", alpha=.5)
    pyplot.ylim(0, 1);
    pyplot.show()

    # This is a dumb quintiple gaussian fit
    # import scipy.optimize

    # def multi_gauss(x, *args):
    #     m1, m2, m3, m4, m5, s1, s2, s3, s4, s5, k1, k2, k3, k4, k5 = args
    #     ret = k1*scipy.stats.norm.pdf(x, loc=m1 ,scale=s1)
    #     ret += k2*scipy.stats.norm.pdf(x, loc=m2 ,scale=s2)
    #     ret += k3*scipy.stats.norm.pdf(x, loc=m3 ,scale=s3)
    #     ret += k4*scipy.stats.norm.pdf(x, loc=m4 ,scale=s4)
    #     ret += k5*scipy.stats.norm.pdf(x, loc=m5 ,scale=s5)
    #     return ret


    # params = [1,1,1, 1, 1, 1, 1, 1, 1,1,1,1,1,1,1]

    # fitted_params,_ = scipy.optimize.curve_fit(multi_gauss,xx, data, p0=params)

    # print fitted_params

    # pyplot.plot(xx, data, 'o')
    # pyplot.show()
    # xxx = np.linspace(np.min(xx), np.max(xx), 1000)
    # pyplot.plot(multi_gauss(xxx, *fitted_params),'-')
    # pyplot.show()

    # Better to use a guassian mixture model
    # http://www.astroml.org/book_figures/chapter4/fig_GMM_1D.html
    # http://scikit-learn.org/0.5/auto_examples/gmm/plot_gmm_pdf.html#example-gmm-plot-gmm-pdf-py
    # http://scikit-learn.org/0.5/modules/gmm.html
    # http://www.nehalemlabs.net/prototype/blog/2014/04/03/quick-introduction-to-gaussian-mixture-models-with-python/
    from sklearn import mixture

    def fit_samples(samples):
        gmix = mixture.GMM(n_components=6, covariance_type='full')
        gmix.fit(samples)

        print gmix.means_
        #colors = gmix.predict(samples)


        logprob, responsibilities = gmix.eval(xx)
        print responsibilities
        pdf = np.exp(logprob)
        pdf_individual = responsibilities * pdf[:, np.newaxis]

        max_per_gauss = np.amax(pdf_individual,axis=0)
        print max_per_gauss
        #pyplot.plot(xx, pdf, '-k')
        pyplot.plot(xx, pdf_individual, '--k')
        pyplot.ylim(0,np.amin(max_per_gauss))
        #pyplot.plot(gmix.eval(xx)[1])
        pyplot.show()


    fit_samples(data)

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

    plot_t(x,y,co,grid2)
    ax = pyplot.gca()
    ax.scatter(xz,yz,c="white")
    plot_boundaries(map_data['poly'],counts)
    pyplot.savefig("interppre_cont"+str(field_name)+".pdf")
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
    pyplot.savefig("interpdone_cont"+str(field_name)+".pdf")
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
    # print patches
    p.set_clim(vmin=20, vmax=73)

    p.set_array(colors)
    ax.add_collection(p)

    ax.set_xlim(12.44,12.66)
    ax.set_ylim(55.61,55.74)
    pyplot.colorbar(p)

map_data = createEmptyMapData()

map_data1 = checkassigned('../data/average_age.json', 'ages', map_data)

#map_data3 = checkassigned('../data/cykler.json', 'bikes', map_data)
#map_data4 = checkassigned('../data/parkingdata.json', 'parking', map_data)


#object.touches