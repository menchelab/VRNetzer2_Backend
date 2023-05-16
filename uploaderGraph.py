
# use functions from CSV-based uploader 
from matplotlib.colors import hex2color
from uploader import *



def hex_to_rgb(hx):
    hx = hx.lstrip('#')
    hlen = len(hx)
    return tuple(int(hx[i:i+hlen//3], 16) for i in range(0, hlen, hlen//3))

def upload_filesJSON(request):
    #print("C_DEBUG:namespace", request.args.get("namespace"))
    form = request.form.to_dict()
    prolist = GD.plist

    namespace = form["namespaceJSON"]
    #if form["namespaceJSON"]:
    #    namespace = form["namespaceJSON"]
    #else:
    #    namespace = form["existing_namespace"]
    if not namespace:
        return "namespace fail"
    
    if namespace in prolist:
        print('project exists')
    else:
        # Make Folders
        makeProjectFolders(namespace)

    folder = 'static/projects/' + namespace + '/'
    pfile = {}
    with open(folder + 'pfile.json', 'r') as json_file:
        pfile = json.load(json_file)
    json_file.close()

    state = ''
    nodelist = {"nodes":[]}

    #------------------
    # get G_json and fill in parts as required for DataDiVR 
    #------------------
    jsonfiles = []
    nodepositions = []
    nodeinfo = []
    nodecolors = []
    links = []
    linkcolors = []
    labels = []
    
    loadGraphJSON(request.files.getlist("graphJSON"), jsonfiles)
    parseGraphJSON_nodepositions(jsonfiles, nodepositions)    
    parseGraphJSON_nodeinfo(jsonfiles, nodeinfo)
    parseGraphJSON_nodecolors(jsonfiles, nodecolors)
    parseGraphJSON_links(jsonfiles, links)
    parseGraphJSON_linkcolors(jsonfiles, linkcolors)
    parseGraphJSON_labels(jsonfiles, labels)
    names = parseGraphJSON_textureNames(jsonfiles)


    #----------------------------------
    # FOR GRAPH TITLE + DESCRIPTION 
    #----------------------------------
    graphtitle = []
    parseGraphJSON_graphtitle(jsonfiles,graphtitle)
    if len(graphtitle) > 0:
        title_of_graph = graphtitle[0]["graphtitle"]
    else:
        title_of_graph = namespace

    graphdesc = []
    parseGraphJSON_graphdesc(jsonfiles,graphdesc)
    if len(graphdesc) > 0:
        descr_of_graph = graphdesc[0]["graphdesc"]
    else:
        descr_of_graph = "Graph decription not specified."



    numnodes = len(nodepositions[0]["data"])
    #print("C_DEBUG for node info: ", nodeinfo)


    # generate node.json
    for i in range(len(nodepositions[0]["data"])):
        thisnode = {}
        thisnode["id"] = i
        if "_geo" in nodepositions[0]["name"]:
            thisnode["lat"] = nodepositions[0]["data"][i][0]
            thisnode["lon"] = nodepositions[0]["data"][i][1]

        if len(nodeinfo[0]["data"]) == len(nodepositions[0]["data"]):
            thisnode["attrlist"] = nodeinfo[0]["data"][i]
            thisnode["n"] = str(nodeinfo[0]["data"][i][0]) #show first element in node annotation for node label

        else:
            thisnode["attrlist"] = ["node" + str(i)]
            thisnode["n"] = "node" + str(i)

        nodelist["nodes"].append(thisnode)

    for labellist in labels:   
        name = ""
        i = 0
        for row in labellist["data"]:
            name = row[0]
            row.pop(0)
            # add to nodes.json
            thisnode = {}
            thisnode["id"] = i + numnodes
            thisnode["group"] = row
            thisnode["n"] = str(name)
            nodelist["nodes"].append(thisnode)
            #add to pfile
            pfile["selections"].append({"name":name, "nodes":row})
            
            # get average pos for Each layout            
            for layout in nodepositions:
                accPos = [0,0,0]
                pos = [0,0,0]

                for x in row:

                    # catch for 2D positions for labels and for empty rows
                    if len(x) > 0 and len(layout["data"][int(x)]) == 3:
                        accPos[0] += float(layout["data"][int(x)][0])
                        accPos[1] += float(layout["data"][int(x)][1])
                        accPos[2] += float(layout["data"][int(x)][2])
                    
                    elif len(x) > 0 and len(layout["data"][int(x)]) == 2: 
                        accPos[0] += float(layout["data"][int(x)][0])
                        accPos[1] += float(layout["data"][int(x)][1])
                        accPos[2] += 0.0

                pos[0] = str(accPos[0] / len(row))
                pos[1] = str(accPos[1] / len(row))
                pos[2] = str(accPos[2] / len(row))
                layout["data"].append(pos)

            for color in nodecolors:
                color["data"].append([255,0,0,255])
            i += 1
    
    
    for file_index in range(len(nodepositions)):  # for layout in nodepositions:
        layout = nodepositions[file_index]
        if len(layout["data"]) > 0 and len(layout["data"][int(x)]) == 3:

            if names[file_index] is not None:
                # if texture name specified
                state =  state + makeXYZTexture(namespace, layout, names[file_index]) + '<br>'
                pfile["layouts"].append(names[file_index])    
                continue
            state =  state + makeXYZTexture(namespace, layout) + '<br>'
            pfile["layouts"].append(layout["name"] + "XYZ")

        # catch for 2D positions and for empty rows
        elif len(layout["data"]) > 0 and len(layout["data"][int(x)]) == 2:
            for i,xy in enumerate(layout["data"]):
                layout["data"][i] = (xy[0],xy[1],0.0)
            
            if names[file_index] is not None:
                # if texture name specified
                state =  state + makeXYZTexture(namespace, layout, names[file_index]) + '<br>'
                pfile["layouts"].append(names[file_index])    
                continue 
            state =  state + makeXYZTexture(namespace, layout) + '<br>'
            pfile["layouts"].append(layout["name"] + "XYZ")

        else: state = "upload must contain at least 1 node position list"


    for file_index in range(len(nodecolors)):  # for color in nodecolors:
        color = nodecolors[file_index]

        if len(color["data"]) == 0:
            color["data"] = [[255,0,255,100]] * numnodes
            color["name"] = "nan"
        if names[file_index] is not None:
            # if texture name specified
            state =  state + makeNodeRGBTexture(namespace, color, names[file_index]) + '<br>'
            pfile["layoutsRGB"].append(names[file_index])    
            continue
        state =  state + makeNodeRGBTexture(namespace, color) + '<br>'
        pfile["layoutsRGB"].append(color["name"]+ "RGB")

    
    for file_index in range(len(links)):  # for linklist in links:
        linklist = links[file_index]

        if len(linklist["data"]) == 0:
            linklist["name"] = "nan"

        if names[file_index] is not None:
            # if texture name specified
            state =  state + makeLinkTexNew(namespace, linklist, names[file_index]) + '<br>'
            pfile["links"].append(names[file_index])    
            continue
        state =  state + makeLinkTexNew(namespace, linklist) + '<br>'
        pfile["links"].append(linklist["name"]+ "XYZ")


    for file_index in range(len(linkcolors)):  # for lcolors in linkcolors:
        lcolors = linkcolors[file_index]

        if len(lcolors["data"]) == 0:
            lcolors["data"] = [[255,0,255,100]] * len(links[0]["data"])
            lcolors["name"] = "nan"

        if names[file_index] is not None:
            # if texture name specified
            state =  state + makeLinkRGBTex(namespace, lcolors, names[file_index]) + '<br>'
            pfile["linksRGB"].append(names[file_index])    
            continue
        state =  state + makeLinkRGBTex(namespace, lcolors) + '<br>'
        pfile["linksRGB"].append(lcolors["name"]+ "RGB")

    pfile["nodecount"] = numnodes
    pfile["labelcount"] = len(labels[0]["data"])
    pfile["linkcount"] = len(links[0]["data"]) 

    #----------------------------------
    # adding graph info to pfile 
    #----------------------------------
    pfile["graphtitle"] = title_of_graph
    pfile["graphdesc"] = descr_of_graph

    #----------------------------------
    # uploading and storing Legends files in folder
    # and adding filenames to pfile 
    #----------------------------------
    legendfiles = []
    loadLegendFiles(request.files.getlist("legendFiles"), folder+'legends/', legendfiles)
    pfile["legendfiles"] = legendfiles




    with open(folder + '/pfile.json', 'w') as outfile:
        json.dump(pfile, outfile)

    with open(folder + '/nodes.json', 'w') as outfile:
        json.dump(nodelist, outfile)
    
    GD.plist = GD.listProjects()
    return state


# -------------------------------------------
# PARSE GRAPH FUNCTIONS 
# -------------------------------------------

def loadGraphJSON(files, target):
    if len(files) > 0: 
        for file in files: 
            G_upload = file.read().decode('utf-8')
            G_json = json.loads(G_upload)
            target.append(G_json)


def parseGraphJSON_nodepositions(files,target):
    if len(files) > 0: 
        for idx,file in enumerate(files):

            name_of_file = "nodepositions"+str(idx)

            # TO DO : catch if name+idx already exists (this could happen if layouts added to project instead of new uploaded) 
            # or consider removing "add to project" option

            num_of_nodes = len(file["nodes"])

            nodepositions = []
            for i in range(0,num_of_nodes):
                nodepositions.append(file["nodes"][i]["pos"])
            vecList = {}
            vecList["data"] = nodepositions
            vecList["name"] = name_of_file
            target.append(vecList)
            #print("C_DEBUG: NODEPOS:", vecList)


def parseGraphJSON_links(files, target):
    if len(files) > 0: 
        #for file in files:

        longest_list = []  
        all_lists = []  
        for idx,file in enumerate(files):

            name_of_file = "links"+str(idx)
            num_of_links = len(file["links"])

            links = []
            for i in range(0,num_of_links):
                links.append([str(file["links"][i]["source"]),str(file["links"][i]["target"])])
            vecList = {}
            vecList["data"] = links
            vecList["name"] = name_of_file
            #target.append(vecList)
            #print("C_DEBUG: LINKS:", vecList)

        # get all uploaded lists from all files i.e. layouts and keep only longest for "links.json" 
            all_lists.append(vecList)
        longest_list = max(all_lists, key=len)
        target.append(longest_list)
        #print("C_DEBUG: all_lists", target)



def parseGraphJSON_linkcolors(files,target):
    if len(files) > 0: 
        #for file in files: 
        for idx,file in enumerate(files):

            name_of_file = "linkcolors"+str(idx)
            num_of_links = len(file["links"])

            linkcolor_pre = []
            for i in range(0,num_of_links):
                linkcolor_pre.append(file["links"][i]["linkcolor"])

            # linkcolors = [(*hex_to_rgb(color),100) for color in linkcolor_hex]
            linkcolors = []
            for linkcol in linkcolor_pre:
                if '#' in linkcol:
                    linkcolors.append((*hex_to_rgb(linkcol),100))
                else:
                    linkcolors.append(linkcol)

            vecList = {}
            vecList["data"] = linkcolors
            vecList["name"] = name_of_file
            target.append(vecList)
            #print("C_DEBUG: LINKCOLORS:", vecList)


def parseGraphJSON_nodeinfo(files,target):
    if len(files) > 0: 
        #for file in files: 
        for idx,file in enumerate(files):

            name_of_file = "nodeinfo"+str(idx)
            
            name_of_file = "nodeinfo"          
            num_of_nodes = len(file["nodes"])

            nodeinfo = []
            for i in range(0,num_of_nodes):
                nodeinfo.append(file["nodes"][i]["annotation"])
            vecList = {}
            vecList["data"] = nodeinfo
            vecList["name"] = name_of_file
            target.append(vecList)
            #print("C_DEBUG: NODEINFO:", vecList)


def parseGraphJSON_nodecolors(files,target):
    if len(files) > 0: 
        #for file in files: 
        for idx,file in enumerate(files):

            name_of_file = "nodecolors"+str(idx)
            num_of_nodes = len(file["nodes"])

            nodecolor_hex = []
            for i in range(0,num_of_nodes):
                nodecolor_hex.append(file["nodes"][i]["nodecolor"])
            nodecolor = [(*hex_to_rgb(color),100) for color in nodecolor_hex]

            vecList = {}
            vecList["data"] = nodecolor
            vecList["name"] = name_of_file
            target.append(vecList)
            #print("C_DEBUG: NODECOLORS:", vecList)


def parseGraphJSON_labels(files,target):
    if len(files) > 0: 
        # keep loop in case cluster labels per layout in update
        for idx,file in enumerate(files):
            
            # get cluster labels from one file only (file i.e. layout)
            one_file = files[0]

            name_of_file = "labels" #+str(idx)         
            num_of_nodes = len(one_file["nodes"])

            nodeclus = []
            nodeids = []
            for i in range(0,num_of_nodes):
                nodeclus.append(one_file["nodes"][i]["cluster"])
                nodeids.append(one_file["nodes"][i]["id"])
            set_nodeclus = list(set(nodeclus))

            labels = []
            for cluster in set_nodeclus:
                sublist = [] 
                for k,v in zip(nodeids,nodeclus):
                    if cluster == v:
                        sublist.append(str(k))
                sublist.insert(0,cluster)
                labels.append(sublist)

            vecList = {}
            vecList["data"] = labels
            vecList["name"] = name_of_file
            target.append(vecList)
            target = list(target[0])# use only one file (i.e.layout) to create labels from / not per layout yet

# FOR GRAPH NAME 
def parseGraphJSON_graphtitle(files,target):
    if len(files) > 0: 
        for file in files:
            name_of_graph = file["graph"]["name"]
            vecList = {}
            vecList["graphtitle"] = name_of_graph 
            target.append(vecList)


# FOR GRAPH DESCRIPTION
def parseGraphJSON_graphdesc(files,target):
    if len(files) > 0: 
        for file in files:
            if "desc" in file["graph"].keys():
                descr_of_graph = file["graph"]["desc"]            
            elif "graphdesc" in file["graph"].keys():
                descr_of_graph = file["graph"]["graphdesc"]
            else: 
                descr_of_graph = "Graph description not specified."
            vecList = {}
            vecList["graphdesc"] = descr_of_graph 
            target.append(vecList)

def parseGraphJSON_textureNames(files):
    out = []

    for file in files:
        if "textureName" not in file.keys():
            # no texture name specified
            out.append(None)
            continue
        if file["textureName"] in out:
            # no duplicates allowed
            out.append(None)
            continue    
        out.append(file["textureName"])
    print(files, out)
    return out