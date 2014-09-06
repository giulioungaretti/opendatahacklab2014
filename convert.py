import json

def toJson(dataset_name, map_df):
    '''
    save json file to disk as a json list of list
    i.e. [{"keyonval":count }..]
    '''
    dictionary = [dict(zip(map_df.id, map_df.counts))]
    with open('data/{0}_data.json'.format(dataset_name), 'w') as outfile:
        json.dump(dictionary, outfile)