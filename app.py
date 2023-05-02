import csv
import json
import logging
import os
from cgi import print_arguments
from io import StringIO
import flask

# from flask_session import Session
from engineio.payload import Payload
from flask import Flask, jsonify, redirect, render_template, request, session, url_for, abort, current_app, make_response, request
import requests
from mimetypes import guess_extension
from werkzeug.utils import secure_filename
from flask_socketio import SocketIO, emit, join_room, leave_room
from PIL import Image, ImageColor

import GlobalData as GD

import load_extensions
import search
import uploader
import uploaderGraph
import util
import websocket_functions as webfunc
import numpy as np
#import preview as pre
import random

import plotlyExamples as PE
import os.path
from os import path

import cartographs_func as CG
import chat
import base64
import chatGPTTest

enableWhisper = True
if enableWhisper:
    import whisperSR as whispR
# load audio and pad/trim it to fit 30 seconds
import TextToSpeech

from base64 import b64encode
import wave













log = logging.getLogger("werkzeug")
log.setLevel(logging.ERROR)

Payload.max_decode_packets = 50


app = Flask(__name__)
app.debug = False
app.config["SECRET_KEY"] = "secret"
app.config["SESSION_TYPE"] = "filesystem"

socketio = SocketIO(app, manage_session=False)
app, extensions = load_extensions.load(app)
    
### HTML ROUTES ###

### Execute code before first request ###
@app.before_first_request
def execute_before_first_request():
    uploader.check_ProjectFolder()
    util.create_dynamic_links(app)
    GD.loadGD()
    GD.loadPFile()
    GD.loadPD()
    GD.loadColor()
    GD.loadLinks()
    GD.loadGraphinfoFile()
    GD.load_annotations()
    whispR.loadModel("small")

@app.route("/")
def index():
    return flask.redirect("/home")

@app.route("/preview")
def preview():
    return render_template("preview.html")

@app.route("/main", methods=["GET"])
def main():
    username = util.generate_username()
    project = GD.data["actPro"]#flask.request.args.get("project")
    if project is None:
        project = GD.data["actPro"]
        return "no project selected in GD.json"

    if flask.request.method == "GET":
        room = 1
        # Store the data in session
        flask.session["username"] = username
        flask.session["room"] = room
        # prolist = uploader.listProjects() 

        return render_template("main.html", user=username,extensions=extensions)
    else:
        return "error"


@app.route('/uploadAudioUE4', methods=['POST'])
def uploadAudioUE4(enableWhisper):
    result = {}
    if enableWhisper:
        
        path = 'static/WisperAudio/' #os.getenv('HOME') + '/python'
        num_files = len([f for f in os.listdir(path)if os.path.isfile(os.path.join(path, f))])
        thisfile = path+str(num_files + 1)
        if request.method == 'POST':
            raw = request.get_data()
            with wave.open(thisfile+".wav", "wb") as audiofile:
                audiofile.setsampwidth(2)
                audiofile.setnchannels(2)
                audiofile.setframerate(48000)
                audiofile.writeframes(raw)
            audiofile.close()
            result["text"] = whispR.dowhisper(thisfile+".wav")
    return result
    

@app.route('/uploadAudio', methods=['POST'])
def uploadAudio(enableWhisper):
    result = {}
    if enableWhisper:
    #print("upload request received")
        path = 'static/WisperAudio/' #os.getenv('HOME') + '/python'
        num_files = len([f for f in os.listdir(path)if os.path.isfile(os.path.join(path, f))])
        thisfile = path+str(num_files + 1)
        
        if 'audio_file' in request.files:
            file = request.files['audio_file']
            # Get the file suffix based on the mime type.
            extname = guess_extension(file.mimetype)
            if not extname:
                abort(400)
            # Save the file to disk.
            file.save(thisfile+".weba")
            result["text"] = whispR.dowhisper(thisfile+".weba")
            print(result)

    return result
    
    abort(400)

@app.route('/GPT', methods=['POST','GET'])
def GPT():
    result = {}
    if request.method == 'POST':
        data = flask.request.get_json()
        print(data.get("text"))
         
        answer, path = chatGPTTest.GPTrequest(data.get("text"))
    return {"text": answer, "audiofile": path +".ogg"}

@app.route('/TTS', methods=['POST','GET'])
def TTS():
    result = {}
    if request.method == 'GET':
        text = flask.request.args.get("text")
        voice = int(flask.request.args.get("voice"))
        result["text"] = TextToSpeech.makeogg(text,"myaudiofile.wav", voice)
    return result

@app.route("/nodepanel", methods=["GET"])
def nodepanel():
    data = []
    return render_template("nodepanel.html", data)


@app.route("/uploadOLD", methods=["GET"])
def upload():
    prolist = GD.listProjects()
    return render_template(
        "upload.html",
        namespaces=prolist,
        extensions=extensions,
        sessionData=json.dumps(GD.data),
    )

@app.route("/upload", methods=["GET"])
def uploadNew():
    prolist = GD.listProjects()
    return render_template(
        "uploadNew.html",
        namespaces=prolist,
        extensions=extensions,
        sessionData=json.dumps(GD.data),
    )

@app.route("/uploadJSON", methods=["GET"])
def uploadJSON():
    prolist = GD.listProjects()
    return render_template(
        "uploadGRAPH.html",
        namespaces=prolist,
        extensions=extensions,
        sessionData=json.dumps(GD.data),
    )


@app.route("/uploadfiles", methods=["GET", "POST"])
def upload_files():
    return uploader.upload_files(flask.request)

@app.route("/uploadfilesNew", methods=["GET", "POST"])
def upload_filesNew():
    return uploader.upload_filesNew(flask.request)

@app.route("/uploadfilesJSON", methods=["GET", "POST"])
def upload_filesJSON():
    return uploaderGraph.upload_filesJSON(flask.request)


@app.route("/delpro", methods=["GET", "POST"])
def delete_project():

    return util.delete_project(flask.request)























# gets information about a specific node (project must be provided as argument)
@app.route("/node", methods=["GET", "POST"])
def nodeinfo():
    
    id = flask.request.args.get("id")
    key = flask.request.args.get("key")
    name = "static/projects/" + str(flask.request.args.get("project")) + "/nodes"
    nodestxt = open(name + ".json", "r")
    nodes = json.load(nodestxt)
    nlength = len(nodes["nodes"]) - len(nodes["labels"])
    print(nlength)
    if key:
        return str(nodes["nodes"][int(id)].get(key))
    else:
        if int(id) > nlength:
        # is label
            print(nodes["labels"][int(id)-nlength])
        return nodes["nodes"][int(id)]






@app.route("/home")
def home():
    if not flask.session.get("username"):
        flask.session["username"] = util.generate_username()
        flask.session["room"] = 1
    return render_template("home.html", sessionData=json.dumps(GD.data))


### DATA ROUTES###


@app.route("/load_all_projects", methods=["GET", "POST"])
def loadAllProjectsR():
    return jsonify(projects=GD.listProjects())


@app.route("/load_project/<name>", methods=["GET", "POST"])
def loadProjectInfoR(name):
    return uploader.loadProjectInfo(name)


@app.route("/projectAnnotations/<name>", methods=["GET"])
def loadProjectAnnotations(name):
    return uploader.loadAnnotations(name)







###SocketIO ROUTES###


@socketio.on("join", namespace="/main")
def join(message):
    room = flask.session.get("room")
    join_room(room)
    print(message['usr'])

    print(
        webfunc.bcolors.WARNING
        + message['usr']
        + " has entered the room."
        + webfunc.bcolors.ENDC
    )
    emit("status",{"usr": message['usr'] , "msg":" has entered the room."},room=room)



@socketio.on("ex", namespace="/main")
def ex(message):
    
    room = flask.session.get("room")
    #print(webfunc.bcolors.WARNING+ flask.session.get("username")+ "ex: "+ json.dumps(message)+ webfunc.bcolors.ENDC)
    #message["usr"] = flask.session.get("username")
    
    print("incoming " + str(message))

    if message["fn"] == "sel":  
        if not message["id"] in GD.pdata.keys():     # check if selection exists in pdata.json
            GD.pdata[message["id"]] = '' 
        GD.pdata[message["id"]] = message["opt"]
        GD.savePD()

    if message['id'] == "protLoad":
        response = {}
        response["usr"] = message["usr"]
        response["id"] = message["id"]
        response["fn"] = "loadProtein"
        response["val"] = GD.pdata["protnamedown"],GD.pdata["protstyle"]
        emit("ex", response, room=room)  # send to all clients


    if message["id"] == "search":
        if len(message["val"]) > 1:
            x = '{"id": "search", "val":[], "fn": "makeNodeButton", "parent":"scrollbox2"}'
            results = json.loads(x)
            results["val"] = search.search(message["val"])
            emit("ex", results, room=room)


    # Chat text message
    if message["fn"] == "chatmessage":
        response = {}
        response = message
        #print("C_DEBUG: in app if chatmessage", response)
        emit("ex", response, room=room)


    elif message["id"] == "nl":
        message["names"] = []
        message["fn"] = "cnl"
        message["prot"] = []
        message["protsize"] = []
        for id in message["data"]:
            message["names"].append(GD.nodes["nodes"][id]["n"])

        emit("ex", message, room=room)
        #print(message)

    # CLIPBOARD 
    # TODO: dont save the colors to file but retrieve them from selected color texture
    elif message["id"] == "cbaddNode":
        if not 'cbnode' in GD.pdata.keys():     # check if selection exists in pdata.json
            GD.pdata["cbnode"] = [] 
        if message["val"] != "init":                # used for initialization for newly joined client
            # if not, create it
            exists = False                          # check if node already exists in selection
            for n in GD.pdata["cbnode"]:
                if n["id"] == GD.pdata["activeNode"]:
                    exists = True
            if not exists:                          # if not, add it
                cbnode = {}
                cbnode["id"] = GD.pdata["activeNode"]
                cbnode["color"]= GD.pixel_valuesc[int(GD.pdata["activeNode"])]
                cbnode["name"] = GD.nodes["nodes"][int(GD.pdata["activeNode"])]["n"]
                GD.pdata["cbnode"].append(cbnode)
                GD.savePD()
            else:
                print("already in selection")

        response = {}
        response["usr"] = message["usr"]
        response["id"] = message["id"]
        response["fn"] = "cbaddNode"
        response["val"] = GD.pdata["cbnode"]
        
        emit("ex", response, room=room)  # send to all clients
        
    elif message["id"] == "cbColorInput":
        # copy active color texture 
        im1 = Image.open("static/projects/"+ GD.data["actPro"]  + "/layoutsRGB/"+ GD.pfile["layoutsRGB"][int(GD.pdata["layoutsRGBDD"])]+".png","r")
        im2 = im1.copy()
        # convert rgb to hex string
        color = ImageColor.getrgb(message["val"])
        pix_val = list(im1.getdata())

        # colorize clipboard selection
        for n in GD.pdata["cbnode"]:
            id = int(n["id"])
            pix_val[id] = color
        im2.putdata(pix_val)

        # save temp texture 
        
        path = "static/projects/"+ GD.data["actPro"]  + "/layoutsRGB/temp1.png"
        im2.save(path)
        im1.close()
        im2.close()
        # send update signal to clients

        response = {}
        response["usr"] = message["usr"]
        response["fn"] = "updateTempTex"
        response["channel"] = "nodeRGB"
        response["path"] = "static/projects/"+ GD.data["actPro"]  + "/layoutsRGB/temp1.png"
        emit("ex", response, room=room)
    
    elif message['fn'] == "analytics":
        project = GD.data["actPro"]
        # add functionality here to analtics
        if message['id'] == "analyticsDegreeRun":
            graph = util.project_to_graph(project)
            arr = util.analytics_degree_distribution(graph)
            print(arr)
        if message['id'] == "analyticsClosenessRun":
            graph = util.project_to_graph(project)
            arr = util.analytics_closeness(graph)
            print(arr)

        if message["id"] == "analyticsPathNode1":
            # set server data: node +  hex color
            if message["val"] != "init":
                if "analyticsData" not in GD.pdata.keys():
                    GD.pdata["analyticsData"] = {}
                    print(GD.pdata)
                if "shortestPathNode1" not in GD.pdata["analyticsData"].keys():
                    GD.pdata["analyticsData"]["shortestPathNode1"] = {}
                GD.pdata["analyticsData"]["shortestPathNode1"]["id"] = GD.pdata["activeNode"]
                GD.pdata["analyticsData"]["shortestPathNode1"]["color"] = util.rgb_to_hex(GD.pixel_valuesc[int(GD.pdata["activeNode"])])
                GD.pdata["analyticsData"]["shortestPathNode1"]["name"] = GD.nodes["nodes"][int(GD.pdata["activeNode"])]["n"]
                GD.savePD()

            # send to clients
            response = {}
            response["usr"] = message["usr"]
            response["id"] = message["id"]
            response["fn"] = "analytics"
            response["val"] = "init"
            if "analyticsData" in GD.pdata.keys():
                if "shortestPathNode1" in GD.pdata["analyticsData"].keys():
                    response["val"] = GD.pdata["analyticsData"]["shortestPathNode1"]
            emit("ex", response, room=room)

        if message["id"] == "analyticsPathNode2":
            # set server data: node +  hex color
            if message["val"] != "init":
                if "analyticsData" not in GD.pdata.keys():
                    GD.pdata["analyticsData"] = {}
                    print(GD.pdata)
                if "shortestPathNode2" in GD.pdata["analyticsData"].keys():
                    GD.pdata["analyticsData"]["shortestPathNode2"] = {}
                GD.pdata["analyticsData"]["shortestPathNode2"]["id"] = GD.pdata["activeNode"]
                GD.pdata["analyticsData"]["shortestPathNode2"]["color"] = util.rgb_to_hex(GD.pixel_valuesc[int(GD.pdata["activeNode"])])
                GD.pdata["analyticsData"]["shortestPathNode2"]["name"] = GD.nodes["nodes"][int(GD.pdata["activeNode"])]["n"]
                GD.savePD()

            # send to clients
            response = {}
            response["usr"] = message["usr"]
            response["id"] = message["id"]
            response["fn"] = "analytics"
            response["val"] = "init"
            if "analyticsData" in GD.pdata.keys():
                if "shortestPathNode2" in GD.pdata["analyticsData"].keys():
                    response["val"] = GD.pdata["analyticsData"]["shortestPathNode2"]
            emit("ex", response, room=room)

        if message["id"] == "analyticsPathRun":
            if "analyticsData" not in GD.pdata.keys():
                print("[Fail] analytics shortest path run: 2 nodes have to be selected.")
                return
            if "shortestPathNode1" not in GD.pdata["analyticsData"].keys():
                print("[Fail] analytics shortest path run: 2 nodes have to be selected.")
                return
            if "shortestPathNode1" not in GD.pdata["analyticsData"].keys():
                print("[Fail] analytics shortest path run: 2 nodes have to be selected.")
                return
            
            node_1 = GD.pdata["analyticsData"]["shortestPathNode1"]["id"]
            node_2 = GD.pdata["analyticsData"]["shortestPathNode2"]["id"]
            graph = util.project_to_graph(project) 
            path = util.analytics_shortest_path(graph, node_1, node_2)
            shortest_path_textures = util.analytics_color_shortest_path(path)

            if shortest_path_textures["textures_created"] is False:
                print("Failed to create textures for Analytics/Shortest Path.")
                return
            response_nodes = {}
            response_nodes["usr"] = message["usr"]
            response_nodes["fn"] = "updateTempTex"
            response_nodes["channel"] = "nodeRGB"
            response_nodes["path"] = shortest_path_textures["path_nodes"]
            emit("ex", response_nodes, room=room)

            response_links = {}
            response_links["usr"] = message["usr"]
            response_links["fn"] = "updateTempTex"
            response_links["channel"] = "linkRGB"
            response_links["path"] = shortest_path_textures["path_links"]
            emit("ex", response_links, room=room)

    elif message["fn"] == "annotation":
        if message["id"] == "annotationOperation":
            if message["val"] == "init":
                if "annotationOperationsActive" not in GD.pdata.keys():
                    GD.pdata["annotationOperationsActive"] = False
            else:
                if "annotationOperationsActive" in GD.pdata.keys():
                    if GD.pdata["annotationOperationsActive"] == True:
                        GD.pdata["annotationOperationsActive"] = False
                    elif GD.pdata["annotationOperationsActive"] == False:
                        GD.pdata["annotationOperationsActive"] = True  
                    if "annotationOperationsActive" not in GD.pdata.keys():
                        GD.pdata["annotationOperationsActive"] = True
            response = {}
            response["usr"] = message["usr"]
            response["id"] = message["id"]
            response["fn"] = "annotation"
            response["val"] = GD.pdata["annotationOperationsActive"]
            emit("ex", response, room=room)
            
        if message["id"] == "annotationRun":
            print(">>> Run Annotation based on selected annotations and operation")
            print(">>> submit new textures")

    elif message["fn"] == "dropdown":
        response = {}
        response["usr"] = message["usr"]
        response["id"] = message["id"]
        response["fn"] = "dropdown"
        response["parent"] = message["id"]

        if 'val' in message.keys():

            # init message called when socket connection is established
            if message["val"] == "init":

                # C A R T O G R A P H S
                # dropdown for layout type selection 
                layout_selected = 0
                if message["id"] == "CGlayouts":  
                    response["opt"] = ["Local layout", "Global layout", "Importance layout"] 
                    response["sel"] = layout_selected
                
                # dropdown for fixed selections, might need a better solution to hardcode them in HTML / JS
                if message["id"] == "analytics":
                    response["opt"] = ["Degree Distribution", "Closeness", "Shortest Path"]
                    response["sel"] = 0

                # dropdown for visualization type selection 
                vis_selected = 0
                if message["id"] == "CGvis":  
                    response["opt"] = ["2D Portrait", "3D Portrait", "Topographic", "Geodesic"] 
                    response["sel"] = vis_selected

                elif message["id"] == "projDD":
                    response["opt"] = GD.plist
                    response["sel"] = GD.plist.index(GD.data["actPro"])

                    response2 = {}
                    response2["usr"] = message["usr"]
                    if not 'nodecount' in GD.pfile:
                        GD.pfile["nodecount"] = len(GD.nodes["nodes"])
                        GD.pfile["labelcount"] = 0
                        GD.pfile["linkcount"] = len(GD.links["links"])
                        GD.savePFile()

                    response2["val"] = GD.pfile
                    response2["fn"] = "project"
                    emit("ex", response2, room=room)
                else:
                    if message["id"] not in GD.pdata:
                        GD.pdata[message["id"]] = 0
                    response["sel"] = GD.pdata[message["id"]]
                    # assign data for options
                    if message["id"] == "layoutsDD":
                        response["opt"] = GD.pfile["layouts"]        
                    elif message["id"] == "layoutsRGBDD":
                        response["opt"] = GD.pfile["layoutsRGB"]
                    elif message["id"] == "linksDD":
                        response["opt"] = GD.pfile["links"]
                    elif message["id"] == "linksRGBDD":
                        response["opt"] = GD.pfile["linksRGB"]
                    elif message["id"] == "selectionsDD":
                        options = []
                        for i in range(len(GD.pfile["selections"])):
                            options.append(GD.pfile["selections"][i]["name"])   
                        response["opt"] = options
                        print(options)

                # dropdown for annotations
                if message["id"] == "annotation-1":
                    response["opt"] = list(GD.annotations.keys())
                    response["sel"] = "0"
                if message["id"] == "annotation-2":
                    response["opt"] = list(GD.annotations.keys())
                    response["sel"] = "0"
                if message["id"] == "annotation-Operations":
                    response["opt"] = ["UNION", "INTERSECTION", "SUBTRACTION"]
                    response["sel"] = "0"

            else:# user input message
                if message["id"] == "projDD": # PROJECT CHANGE
                    GD.data["actPro"] = GD.plist[int(message["val"])]
                    GD.saveGD()
                    GD.loadGD()
                    GD.loadPFile()
                    GD.loadPD()
                    GD.loadColor() 
                    GD.loadLinks()
                    GD.loadGraphinfoFile()
                    GD.load_annotations()
                    
                    response["sel"] = message["val"]
                    response["name"] = message["msg"]
                    print("changed Project to " + str(GD.plist[int(message["val"])]))

                    response2 = {}
                    response2["usr"] = message["usr"]
                    response2["val"] = GD.pfile
                    response2["fn"] = "project"
                    emit("ex", response2, room=room)


                else:
                    response["sel"] = message["val"] 
                    response["name"] = message["msg"]
                    if message["id"] not in GD.pdata:
                        GD.pdata[message["id"]] = ""
                        print("newGD Variable created")

                    GD.pdata[message["id"]] = message["val"]
                    GD.savePD()
                    

                if message["id"] == "selectionsDD":
                    print(GD.pfile["selections"][int(message["val"])]["nodes"])
                    response2 = {}
                    response2["usr"] = message["usr"]
                    response2["id"] = message["id"]
                    response2["parent"] = "scrollbox1"
                    response2["fn"] = "makeNodeButton"
                    response2["val"] = []
                    ids = GD.pfile["selections"][int(message["val"])]["nodes"]
                    for d in ids:
                        node = {}
                        node["name"] = GD.nodes["nodes"][int(d)]["n"]
                        node["color"] =  GD.pixel_valuesc[int(d)]
                        node["id"] = d
                        response2["val"].append(node)
                    emit("ex", response2, room=room)

        emit("ex", response, room=room)
        print(response)


    # EXPERIMENTAL dynamic svg creation with matplotlib 
    elif message["fn"] == "showSVG":
        emit("ex", PE.matplotsvg(message), room=room)
   
    # EXPERIMENTAL saving html file to disk 
    elif message["fn"] == "showPlotly":
        emit("ex", PE.writeHtml(), room=room)
        

    elif message["fn"] == "Plotly2js":
        response = {}
        response["fn"] = "plotly2js" 
        response["parent"] = message["parent"] # target <div>

        if message["msg"] == "Graph":
            response["val"] = PE.networkGraph()
            emit("ex", response, room=room)
        elif message["msg"] == "Barchart":
            response["val"] = PE.connectionBarGraph()
            emit("ex", response, room=room)
        elif message["msg"] == "timeGraph":
            response["val"] = PE.timeGraph()
            emit("ex", response, room=room)
        elif message["msg"] == "scatterGraph":
            response["val"] = PE.scatterGraph()
            emit("ex", response, room=room)
            
        # Draw Cartographs
        elif message["msg"] == "draw graph":
            response["val"] = CG.cartoGraphs() 
            emit("ex", response, room=room)

    elif message["fn"] == "submit_butt":
        if message["parent"] not in GD.pdata:
            GD.pdata[message["parent"]] = []
        if message["val"] != "init":
            GD.pdata[message["parent"]].append(message["val"])
            GD.savePD()
        response = {}
        response["fn"] = "serVarExample"
        response["parent"] = message["parent"]

        response["buttons"] = GD.pdata[message["parent"]]
        #print(response)
        emit("ex", response, room=room)

    elif message["fn"] == "sli":
        if message["id"] not in GD.pdata:
            GD.pdata[message["id"]] = ""
            print("newGD Variable created")
        if message["val"] != "init":

            GD.pdata[message["id"]] = message["val"]
            GD.savePD()
        response = {}
        response["usr"] = message["usr"]
        response["fn"] = "sli"
        response["id"] = message["id"]
        response["val"] = GD.pdata[message["id"]]
        print(response)
        emit("ex", response, room=room)

    elif message["fn"] == "node":
        response = {}
         
        response["val"]= {}
        response["fn"] = "node"
        response["id"] = message["val"]
        response["nch"] = len(GD.nchildren[int(message["val"])])
        response["val"] = GD.nodes["nodes"][int(message["val"])]
        GD.pdata["activeNode"] = message["val"]
        
        if "protein_info" in GD.nodes["nodes"][int(message["val"])]:
            if not 'protstyle' in GD.pdata.keys():     # check if selection exists in pdata.json
                GD.pdata['protstyle'] = '' 
            GD.pdata['protstyle'] = list(GD.nodes["nodes"][int(message["val"])]["protein_info"][0].keys())[1]

            if not 'protnamedown' in GD.pdata.keys():     # check if selection exists in pdata.json
                GD.pdata['protstyle'] = '' 
            GD.pdata['protnamedown'] = GD.nodes["nodes"][int(message["val"])]["uniprot"][0]

            GD.savePD()

        # print(response)
        emit("ex", response, room=room)
    
    elif message["fn"] == "children":
        response2 = {}
        response2["usr"] = message["usr"]
        response2["id"] = "children"
        response2["parent"] = "scrollbox3"
        response2["fn"] = "makeNodeButton"
        response2["nid"] = GD.nodes["nodes"][int(GD.pdata["activeNode"])]["n"]
        response2["val"] = []

        ids = GD.nchildren[int(GD.pdata["activeNode"])]
        for d in ids:
            node = {}
            node["name"] = GD.nodes["nodes"][int(d)]["n"]
            node["color"] =  GD.pixel_valuesc[int(d)]
            node["id"] = d
            response2["val"].append(node)
        print(response2)
        emit("ex", response2, room=room)
    else:
        emit("ex", message, room=room)
   

@socketio.on("left", namespace="/main")
def left(message):
    room = flask.session.get("room")
    username = flask.session.get("username")
    leave_room(room)
    flask.session.clear()
    emit("status", {"msg": username + " has left the room."}, room=room)
    print(
        webfunc.bcolors.WARNING
        + flask.session.get("username")
        + " has left the room."
        + webfunc.bcolors.ENDC
    )
    util.construct_nav_bar(app)


if __name__ == "__main__":
    socketio.run(app, debug=True)
