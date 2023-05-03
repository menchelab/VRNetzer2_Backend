"""
Functions for Analytics Module
"""
import GlobalData as GD
import networkx as nx
from PIL import Image
import math
import json


def analytics_degree_distribution(graph):
    # nx graph to degree distribution
    degree_sequence = [d for n, d in graph.degree()] # index is node id, value is degree
    print(degree_sequence)


def analytics_closeness(graph):
    # nx graph to closeness distribution
    closeness_seq = [nx.closeness_centrality(graph, node) for node in graph.nodes()]
    print(closeness_seq)


def analytics_shortest_path(graph, node_1, node_2):
    path = nx.shortest_path(graph, source=node_1, target=node_2, method="dijkstra")
    return path

def analytics_color_shortest_path(path):
    # might include this into shortest_path function
    path = [int(node) for node in path]
    node_colors = []
    for node in range(len(GD.pixel_valuesc)):
        if node in path:
            node_colors.append((255, 166, 0, 100))
            continue
        node_colors.append((66, 66, 66, 100))
    # get links
    link_colors = []
    try:
        with open("static/projects/"+ GD.data["actPro"] + "/links.json", "r") as links_file:
            links = json.load(links_file)
        # set link colors
        for link in links["links"]:
            if int(link["s"]) in path and int(link["e"]) in path:
                link_colors.append((244, 255, 89, 150))
                continue
            link_colors.append((66, 66, 66, 30))
        
        # create images
        dim_nodes = math.ceil(math.sqrt(len(node_colors)))
        dim_links = math.ceil(math.sqrt(len(link_colors)))
        texture_nodes = Image.new("RGBA", (dim_nodes, dim_nodes))
        texture_links = Image.new("RGBA", (dim_links, dim_links))
        texture_nodes.putdata(node_colors)
        texture_links.putdata(link_colors)
        path_nodes = "static/projects/"+ GD.data["actPro"]  + "/layoutsRGB/temp.png"
        path_links = "static/projects/"+ GD.data["actPro"]  + "/linksRGB/temp.png"
        texture_nodes.save(path_nodes, "PNG")
        texture_links.save(path_links, "PNG")
        return {"textures_created": True, "path_nodes": path_nodes, "path_links": path_links}
    except:
        return {"textures_created": False}