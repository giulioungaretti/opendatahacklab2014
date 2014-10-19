import json


def toJson(dataset_name, map_df):
    '''
    save json file to disk as a json list of list
    i.e. [{"keyonval":count }..]
    '''
    dictionary = [dict(zip(map_df.id, map_df.counts))]
    with open('../website/data/{0}_index.json'.format(dataset_name), 'w') as outfile:
        json.dump(dictionary, outfile)

# def toSingleJson(name,map_df_array):
# 	'''
#     save json file to disk as a json list of list
#     i.e. [{"keyonval":count }..]
#     '''

#     all_counts = [map_df[i].counts for i in range(0,shape(map_df_array[0]))]

# 	dictionary0 = [dict(zip(map_df.id, map_df.counts))]
#     dictionary1= [dict(zip(map_df[0].id, all_counts))]

#     print dictionary0
#     print dictionary1

#     with open('../website/data/{0}_index.json'.format(name), 'w') as outfile:
#         json.dump(dictionary1, outfile)