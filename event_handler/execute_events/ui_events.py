import PIL
from flask_socketio import emit

import GlobalData as GD


def selection_event(message):
    if not message["id"] in GD.pdata.keys():  # check if selection exists in pdata.json
        GD.pdata[message["id"]] = ""
    GD.pdata[message["id"]] = message["opt"]
    GD.savePD()


def colorbox_event(message, room):
    # copy active color texture
    im1 = PIL.Image.open(
        "static/projects/"
        + GD.data["actPro"]
        + "/layoutsRGB/"
        + GD.pfile["layoutsRGB"][int(GD.pdata["layoutsRGBDD"])]
        + ".png",
        "r",
    )
    im2 = im1.copy()
    # convert rgb to hex string
    color = (
        int(message["r"]),
        int(message["g"]),
        int(message["b"]),
        int(message["a"] * 255),
    )
    pix_val = list(im1.getdata())

    # colorize clipboard selection
    for n in GD.pdata["cbnode"]:
        id = int(n["id"])
        pix_val[id] = color
    im2.putdata(pix_val)

    # save temp texture

    path = "static/projects/" + GD.data["actPro"] + "/layoutsRGB/temp1.png"
    im2.save(path)
    im1.close()
    im2.close()
    # send update signal to clients
    textures = [
        {
            "channel": "nodeRGB",
            "path": "static/projects/" + GD.data["actPro"] + "/layoutsRGB/temp1.png",
        }
    ]
    response = {"usr": message["usr"], "fn": "updateTempTex", "textures": textures}

    emit("ex", response, room=room)
    emit("ex", message, room=room)


def legend_scene_display_event(message, room):
    # only here for managing forward and backward click
    if "scenes" in GD.pfile.keys():
        new_scene = GD.pfile["scenes"][message["val"]]
        emit(
            "ex",
            {"fn": "legend_scene_display", "has_scenes": True, "text": new_scene},
            room=room,
        )
    else:
        emit("ex", {"fn": "legend_scene_display", "has_scenes": False}, room=room)


def slider_event(message, room):
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


def submit_event(message, room):
    if message["parent"] not in GD.pdata:
        GD.pdata[message["parent"]] = []
    if message["val"] != "init":
        GD.pdata[message["parent"]].append(message["val"])
        GD.savePD()
    response = {}
    response["fn"] = "serVarExample"
    response["parent"] = message["parent"]

    response["buttons"] = GD.pdata[message["parent"]]
    # print(response)
    emit("ex", response, room=room)


def node_event(message, room):
    response = {}

    response["val"] = {}
    response["fn"] = "node"
    response["id"] = message["val"]
    response["nch"] = len(GD.nchildren[int(message["val"])])
    response["val"] = GD.nodes["nodes"][int(message["val"])]
    GD.pdata["activeNode"] = message["val"]

    if "protein_info" in GD.nodes["nodes"][int(message["val"])]:
        if (
            not "protstyle" in GD.pdata.keys()
        ):  # check if selection exists in pdata.json
            GD.pdata["protstyle"] = ""
        GD.pdata["protstyle"] = list(
            GD.nodes["nodes"][int(message["val"])]["protein_info"][0].keys()
        )[1]

        if (
            not "protnamedown" in GD.pdata.keys()
        ):  # check if selection exists in pdata.json
            GD.pdata["protstyle"] = ""
        GD.pdata["protnamedown"] = GD.nodes["nodes"][int(message["val"])]["uniprot"][0]

        GD.savePD()

    # print(response)
    emit("ex", response, room=room)


def children_event(message, room):
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
        node["color"] = GD.pixel_valuesc[int(d)]
        node["id"] = d
        response2["val"].append(node)
    print(response2)
    emit("ex", response2, room=room)