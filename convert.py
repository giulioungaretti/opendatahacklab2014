import json

def toJson(self):
    '''
    save json file to disk as a json list of list
    i.e. [{"keyonval":count }..]
    '''
    dictionary = [dict(zip(self.map_df.names, self.map_df.counts))]
    with open('data/{0}_data.json'.format(self.dealer), 'w') as outfile:
        json.dump(dictionary, outfile)