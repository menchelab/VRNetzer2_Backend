
var socket;
var newcon = true;
var logAll = true;
var isPreview = false;logjs
var isMain = false;
var isUE4 = false;

    
if (String(navigator.userAgent).includes("UnrealEngine")){
    isUE4 = true;
       
}else{
    console.log("not ue4") 
}


function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

function logjs(data, id){
    if(document.getElementById("userid")){
        var content = document.getElementById(id).shadowRoot.getElementById("box");
        let x = content.innerHTML;
        if(x.length > 2000){
            removeAllChildNodes(content);
        } 
       
        $(content).prepend('<pre><code>' + JSON.stringify(data, undefined, 2) + '</pre></code>');
      
    }
}



var uid = makeid(10);
console.log("Logged in as " + uid);

ue.interface.projectLoaded = function (data) {
    console.log(data);
    var text = '{"id":"x", "success": "true", "fn": "projectLoaded"}';
    var out = JSON.parse(text);
    out["usr"] = uid;
    socket.emit('ex', out);
    logjs(data, 'scrollbox_debug_1');
};

ue.interface.nodelabels = function (data) {
    console.log(data);
    var text = '{"id":"nl", "data": [], "fn": "x"}';
    var out = JSON.parse(text);
    out.data = data;
    socket.emit('ex', out);
};

ue.interface.nodelabelclicked = function (data) {
    console.log(data);
    var text = '{"id":"node", "val": -1, "fn": "node"}';
    var out = JSON.parse(text);
    out.val = data;
    socket.emit('ex', out);

};

ue.interface.spee = function (data) {
    console.log(data);
    var text = '{"id":"node", "val": -1, "fn": "textinput"}';
    var out = JSON.parse(text);
    x = JSON.parse(data)
    out.id = x.id;
    out.val = x.text;
    socket.emit('ex', out);
   
};


function updateMcElements(){
    dynelem = document.getElementsByClassName("GD");
            
    for (let i = 0; i < dynelem.length; i++) {
        switch(dynelem[i].getAttribute('type'))
        {
            case 'textinput':
                socket.emit('ex', { usr:uid, id: dynelem[i].getAttribute('id'), parent: dynelem[i].getAttribute('container'), fn: "submit_butt", val:"init"});
                break;
            case 'slider':
                socket.emit('ex', { usr:uid, id: dynelem[i].getAttribute('id'), fn: "sli", val:"init"});
                break;
            case 'dropdown':
                socket.emit('ex', { usr:uid, id: dynelem[i].getAttribute('id'), fn: "dropdown", val:"init"});
                break;
        }
        //console.log(dynelem[i].getAttribute('container'));
    }
    // add here init values for new joined client
    socket.emit('ex', { usr:uid, id: "cbaddNode", fn: "addNode", val:"init"});
    socket.emit('ex', { usr:uid, id: "analyticsPathNode1", fn:"analytics", val:"init"});
    socket.emit('ex', { usr:uid, id: "analyticsPathNode2", fn: "analytics", val:"init"});
    socket.emit('ex', { usr:uid, id: "annotationOperation", fn: "annotation", val:"init"});
    socket.emit('ex', { usr:uid, id: "annotationRun", fn: "annotation", val:"init"});
}

function reconnect(){
    location.reload()
}

function speakNow(text) {
    if ('speechSynthesis' in window) {
        // Speech Synthesis supported 🎉
        const message = new SpeechSynthesisUtterance(text);
        message.lang = "en-US";
        
        const voices = speechSynthesis.getVoices().filter(voice => voice.lang === "en-US");
        console.log(voices)
        message.voice = voices[1];
      
        speechSynthesis.speak(message);
       }else{
         // Speech Synthesis Not Supported 😣
         console.log("Sorry, your browser doesn't support text to speech!");
       }

   }

$(document).ready(function(){

    speakNow("Hello Human! Welcome to the data diver.")

    if(document.getElementById("preview")){
        isPreview = true;
    }
    if(document.getElementById("main")){
        isMain = true;
    }

    if(document.getElementById("scrollbox1")){
        document.getElementById("scrollbox1").style.display = "none";
    }
    if(document.getElementById("scrollbox2")){
        document.getElementById("scrollbox2").style.display = "none";
    }

    if(document.getElementById("userid")){
        document.getElementById("userid").innerHTML = uid;
    }
   

    ///set up and connect to socket
    console.log('http://' + document.domain + ':' + location.port + '/main');
    socket = io.connect('http://' + document.domain + ':' + location.port + '/main');
    socket.io.opts.transports = ['websocket'];

    socket.on('connect', function() {
        var msg = {usr:uid}
        socket.emit('join', msg);
    });


    socket.on('disconnect', function () {
        console.log("disconnected - trying to connect")
        socket.emit('join', {});
        if(document.getElementById("disconnected")){
            document.getElementById("disconnected").style.display = "block"
        }
        if(document.getElementById("outer")){
            document.getElementById("outer").style.backgroundColor = "rgb(239 0 0 / 34%)"
        }
        

    });

    socket.on('status', function(data) {
        console.log(data)
        if (data.usr == uid){
            if(isMain || isPreview){
                // START initialization routine
                socket.emit('ex', { id: "projDD", fn: "dropdown", val:"init", usr:uid});
            }

            if(document.getElementById("disconnected")){
                document.getElementById("disconnected").style.display = "none"
            }
            if(document.getElementById("outer")){
                document.getElementById("outer").style.backgroundColor = "rgb(0 0 0 / 0%)"   
            }
            socket.emit('ex', { usr:uid, id: "analytics", fn: "dropdown", val:"init"});
        }
        //CONNECTION Established - initialize the project (Ui elements initialize when project changes)
        
    });

    
    socket.on('ex', function(data) {
        logjs(data, 'scrollbox_debug_0');
         
        //if (logAll && data.usr == uid)
        //{
            console.log("server returned: " + JSON.stringify(data));

        //}

        switch(data.fn)
        {   
            case 'projectLoaded':

               updateMcElements();

                if (data.usr == uid){
                    
                    if(isPreview){
                        // Wait until ui is initialized
                        setTimeout(function() {
                            initialized = true;
                            makeNetwork();
                          }, 1000);   
                    }

                }
 
                break;

            case 'mkB':
                makeButton(data.id, data.msg, data.msg);
                break;

                
            case 'rem_butt_del':
                if ($('#' + data.parent).find('#' + data.id).length) {
                    // found! -> remove in only in that div
                    $('#' + data.parent).find('#' + data.id).remove();
                }
                break;

            
            case 'rem_butt_del_sbox':
                var box = document.getElementById(data.parent).shadowRoot.getElementById("box");
                 $(box).find('#' + data.id).remove();
                break;

            case 'col':
                        // SPECIAL CASE: Refresh Page When loading new project
                        var colorpicker = document.getElementById(data.id).shadowRoot.getElementById("color");
                        colorpicker.value= data.val;
                     
                      //  $('#'+ data.id).value(data.val);
                        console.log(data.val);
    
                        break; 

            case 'sli':
                //$('#'+ data.id).slider('value', data.val);
                if(document.getElementById(data.id)){
                    var slider = document.getElementById(data.id).shadowRoot.getElementById("myRange");
                    slider.value= data.val;
                }
                ue4(data["fn"], data);
                break; 
            /* 
            case 'tex':
                    var text = document.getElementById(data.id).shadowRoot.getElementById("text");
                    text.value= data.val;
                break;*/  
            case 'scb':
                    //settextscroll(data.id, data.msg);
                break;  
        
            case 'makeNodeButton':
                //console.log(data.val.length);
                document.getElementById(data.parent).style.display = "block";
                var content = document.getElementById(data.parent).shadowRoot.getElementById("box");
                removeAllChildNodes(content);
                for (let i = 0; i < data.val.length; i++) {
                    $(content).append("<mc-button id = 'button"+ i + " 'val= '"+ data.val[i].id + "' name = '"+ data.val[i].name +  "' w = '118' fn = 'node' color = '" + rgbToHex(data.val[i].color[0]*0.5,data.val[i].color[1]*0.5,data.val[i].color[2]*0.5) + "' ></mc-button>");
                }
                if (data.id == "search") {
                    document.getElementById("searchcount").innerHTML = "["+ data["val"].length + "]";
                }
                if (data.id == "children") {
                    document.getElementById("linkL2").innerHTML = data["nid"] + "<br><h6>" + "["+ data["val"].length+" Links]</h6>";

                }
                break;
            
            case "cbaddNode":
                var content = document.getElementById('cbscrollbox').shadowRoot.getElementById("box");
                removeAllChildNodes(content);
                for (let i = 0; i < data.val.length; i++) {
                    $(content).append("<mc-button id = 'button"+ i + " 'val= '"+ data.val[i].id + "' name = '"+ data.val[i].name +  "' w = '118' fn = 'node' color = '" + rgbToHex(data.val[i].color[0]*0.5,data.val[i].color[1]*0.5,data.val[i].color[2]*0.5) + "' ></mc-button>");
                }
                break;
            case "colorbox":
                document.getElementById(data.id).shadowRoot.getElementById("color").style.backgroundColor = 'rgba(' + data.r + ',' + data.g + ',' + data.b +',' + data.a*255 + ')';
                break;

            case "updateTempTex":
                if(isPreview){
                    downloadTempTexture(data["path"], data["channel"])
                }else{
                    ue4(data["fn"], data);
                }
                break;

            case "updateTempLayout":
                if(isPreview){
                    updateLayoutTemp(data["path_low"], data["path_hi"])
                }else{
                    ue4(data["fn"], data);
                }
                break;
    


            case 'node':
                if(document.getElementById("nodeL2")){
                    document.getElementById("nodeL2").innerHTML = data["val"]["n"] + "<br><h6>" + "["+ data["nch"]+" Links]</h6>"; 
                    document.getElementById("nodeRawdata").textContent = JSON.stringify(data["val"], undefined, 2);
                    document.getElementById("nodecount").innerHTML = "["+ data["val"]["id"] + "]";
                }
                if(isPreview){setUserLabelPos(data["val"]["id"], data["val"]["n"]);}
                //$("#piechart").append("<d3pie-widget data = '{a: " + Math.floor(Math.random()*100) + ", b: " + Math.floor(Math.random()*100) + ", c:" + Math.floor(Math.random()*100) + ", d:" + Math.floor(Math.random()*100) + ", e:" + Math.floor(Math.random()*100) + ", f:" + Math.floor(Math.random()*100) + ", g:" + Math.floor(Math.random()*100) + "}' color = '#" + Math.floor(Math.random()*16777215).toString(16) + "'></d3draw-widget>");
                ue4(data["fn"], data);
                if(document.getElementById("mProtein_container")){
                    
                    
                    if (data.val.hasOwnProperty("protein_info")){
                        var styldata = []
                        initDropdown("protnamedown", data.val.uniprot, data.val.uniprot[0]);
                        if (data.val.protein_info.length > 0){
                            for (let i = 0; i < Object.keys(data.val.protein_info[0]).length; i++) {
                                if (Object.keys(data.val.protein_info[0])[i] != 'file') {
                                    styldata.push(Object.keys(data.val.protein_info[0])[i])
                                }
                                    
                            }
                            document.getElementById("mProtein_container").style.display = "block";
                            initDropdown("protstyle", styldata, styldata[0]);
                        }
                        
                    }
                    else{
                        document.getElementById("mProtein_container").style.display = "none";

                    }
                }

                break;
                 
            case 'loadProtein':
                ue4(data["fn"], data);
                break;
                
            case 'svg':
                var container = document.getElementById(data["parent"])
                container.innerHTML = data["val"];                   
                //document.getElementById("patch_3").addEventListener("click", function() {
                //  alert('www.link1.com')
                //});
                break;

            case 'plotly':
                console.log("plotly");
                
                $("#plotlytest").load("/Plotly/TEST111");
                var mvar = [];
                $(".slicetext").each(function() {
                    console.log("found");
                    mvar.push($(this))
                    $(this).click(function() {0
                        alert( "Handler for .click() called." );
                      });
                });
                console.log(mvar);

                break;
                
            case 'plotly2js':
                //console.log(data["parent"]);
                if(document.getElementById(data["parent"])){
                    const config = {displayModeBar: false}; // this is the line that should hide the navbar.
                    const layout = {};
                    var gdata = JSON.parse(data["val"])
                    //console.log(gdata);

                    Plotly.newPlot(data["parent"], gdata, layout, config);
                    var myPlot = document.getElementById(data["parent"]);
                    myPlot.on('plotly_click', function(data){
                        if (data.points[0].hasOwnProperty("meta")){  // add callback to nodebuttton automatically if provided
                            console.log(data.points[0].meta);
                            socket.emit('ex', { msg: "none", id: "none",val: data.points[0].meta,  fn: 'node'});
                        }
                        else if (data.points[0].hasOwnProperty("label")){
                            console.log(data.points[0].label);
                        }
                        else if(data.points[0].hasOwnProperty("text")){
                            console.log(data.points[0].text);
                        }else {
                            console.log(data.points[0]);
                        }
                    });
                        
                    // this is the line that hides the bar for real
                    const NavBar = document.getElementsByClassName("modebar-container");
                    for (let i = 0; i < NavBar.length; i++) {
                    NavBar[i].style.visibility = "hidden";
                    }
                }
                break;



            case 'dropdown':
                if(document.getElementById(data.id)){
                    var select = document.getElementById(data.id).shadowRoot.getElementById("sel");
                    var count = document.getElementById(data.id).shadowRoot.querySelector("#count");
                    var content = document.getElementById(data.id).shadowRoot.getElementById("content");
                    
                    if(data.hasOwnProperty('opt')){
                    
                        removeAllChildNodes(content);
                        cmul = 70;
                        //.log(data.opt.length)
                        for (let i = 0; i < data.opt.length; i++) {
                            $(content).append("<mc-button id = 'button"+ i + " 'val= '"+ i + "' name = '"+ data.opt[i] +  "' w = '375' parent = '"+ data.parent + "' fn = 'dropdown' color = '" + rgbToHex(Math.floor(Math.random()*cmul),Math.floor(Math.random()*cmul),Math.floor(Math.random()*cmul)) + "' ></mc-button>");
                        }
                        select.value = data.opt[data.sel]
                        count.innerHTML = " [" + data.opt.length + "]"
                        content.style.display = "none";
                    }else{
                        //this comes from the buttons
                        select.value = data.name;
                        content.style.display = "none";
                    }

                    if(isPreview){
                        if(data.id == "layoutsDD"){
                            actLayout = data.sel;
                            makeNetwork();
                        }
                        else if(data.id == "layoutsRGBDD"){
                            actLayoutRGB = data.sel;
                            makeNetwork();
                        }
                        else if(data.id == "linksDD"){
                            actLinks = data.sel;
                            makeNetwork();
                        }
                        else if(data.id == "linksRGBDD"){
                            actLinksRGB = data.sel;
                            makeNetwork();
                        }
                    }
                    if (data.id == "analytics"){
                        $('.analyticsOption').css('display', 'none');
                        switch (data.name){
                            case "Degree Distribution":
                                $("#analyticsSelectedDegree").css('display', 'inline-block');
                            break;
                            case "Closeness":
                                $("#analyticsSelectedCloseness").css('display', 'inline-block');
                            break;
                            case "Shortest Path":
                                $("#analyticsSelectedPath").css('display', 'inline-block');
                            break;
                            case "Eigenvector":
                                $("#analyticsSelectedEigenvector").css('display', 'inline-block');
                            break;
                            case "Mod-based Communities":
                                $("#analyticsSelectedModcommunity").css('display', 'inline-block');
                            break;
                            case "Clustering Coefficient":
                                $("#analyticsSelectedClusteringCoeff").css('display', 'inline-block');
                            break;
                            // add bindings for options display here

                        }
                    }
                }
   
                ue4(data["fn"], data);    
                break;
            
            case "project":

                //clearProject();
                //if (data["usr"]==uid){
                    pfile = data["val"];
                    let legendcount=0;

                    // init analytics container
                    document.getElementById('analyticsContainer').innerHTML = '';
                    document.getElementById('nodecounter').innerHTML = pfile['nodecount']+' NODES';
                    document.getElementById('linkcounter').innerHTML = pfile['linkcount']+' LINKS';

                    var content = document.getElementById('cbscrollbox').shadowRoot.getElementById("box");
                    removeAllChildNodes(content);
                    //--------------------------------
                    // initial inf on L E G E N D P A N E L 
                    Legend_displayGraphInfo(pfile.name);

                    // changing with Layout: 
                    Legend_displayfirstGraphLayout(pfile.name);
                    Legend_displayfirstNodeInfo(pfile.name);
                    Legend_displayfirstLinkInfo(pfile.name);
                    Legend_displayfirstFile(pfile.name);
                    //--------------------------------

                    if (isPreview){
                        
                        downloadProjectTextures(); // download textures for preview, report when done
                    }
                    ue4(data["fn"], data);   
                //}    
            break;
            
            case "cnl":
                ue4(data["fn"], data);    
                break;

            case "checkbox":
                if(document.getElementById(data["id"])){
                    document.getElementById(data["id"]).shadowRoot.getElementById("box").checked = data["val"];
                }
                if(data["id"]=="linkblendCHK"){
                    ue4("linkblend", data);
                }
                break;
            
            case "ue4":
                ue4(data["fn"], data);    

                if (data.id == "forwardstep") {
                    Legend_displayNodeLinkInfo_forward(pfile.name);
                    Legend_displayGraphLayout_forward(pfile.name);
                    
                } else if (data.id == "backwardstep") {
                    Legend_displayNodeLinkInfo_backward(pfile.name);
                    Legend_displayGraphLayout_backward(pfile.name);


                }

                break;

            case "textinput":
                console.log(data.val + " --- " + data.id);
                if(document.getElementById(data.id)){
                    var content = document.getElementById(data.id).shadowRoot.getElementById("text");
                    content.value = data.val;
                }

                break;

            case "chatmessage":
                displayChatText(data);
                // console.log("C_DEBUG: print text message")
                // ue4(data["fn"], data); // NOT TESTED IF Username taken from ue4
                break;
            case "analytics":

                if (data.id == "analyticsDegreePlot") {
                    const config = {displayModeBar: false};
                    const layout = {};
                    let plot_data = JSON.parse(data["val"]);
    
                    Plotly.newPlot(data["target"], plot_data, layout, config);

                    let plotIFrame = document.getElementById(data["target"]);

                    let user = data.usr;
                    let targetDiv = data.target;
                    plotIFrame.on('plotly_click', function(data){
                        if (data.event.button !== 0){return;}

                        let clickedBarX = Math.floor(data.points[0].x);
                        
                        console.log(clickedBarX);

                        let request = {
                            fn: "analytics",
                            id: "analyticsDegreeRun",
                            highlight: clickedBarX,
                            target: targetDiv,
                            usr: user
                        }

                        socket.emit("ex", request);
                    });
                    
                    plotIFrame.style.display = "inline-block";
                    const NavBar = document.getElementsByClassName("modebar-container");
                    for (let i = 0; i < NavBar.length; i++) {NavBar[i].style.visibility = "hidden";}
                }

                if (data.id == "analyticsClosenessPlot") {
                    const config = {displayModeBar: false};
                    const layout = {};
                    let plot_data = JSON.parse(data["val"]);
    
                    Plotly.newPlot(data["target"], plot_data, layout, config);

                    let plotIFrame = document.getElementById(data["target"]);

                    let user = data.usr;
                    let targetDiv = data.target;
                    plotIFrame.on('plotly_click', function(data){
                        if (data.event.button !== 0){return;}

                        let clickedBarX = data.points[0].x;
                        
                        console.log(clickedBarX);

                        let request = {
                            fn: "analytics",
                            id: "analyticsClosenessRun",
                            highlight: clickedBarX,
                            target: targetDiv,
                            usr: user
                        }

                        socket.emit("ex", request);
                    });
                    
                    plotIFrame.style.display = "inline-block";
                    const NavBar = document.getElementsByClassName("modebar-container");
                    for (let i = 0; i < NavBar.length; i++) {NavBar[i].style.visibility = "hidden";}
                }

                if (data.id == "analyticsEigenvectorPlot") {
                    const config = {displayModeBar: false};
                    const layout = {};
                    let plot_data = JSON.parse(data["val"]);
    
                    Plotly.newPlot(data["target"], plot_data, layout, config);

                    let plotIFrame = document.getElementById(data["target"]);

                    let user = data.usr;
                    let targetDiv = data.target;
                    plotIFrame.on('plotly_click', function(data){
                        if (data.event.button !== 0){return;}

                        let clickedBarX = data.points[0].x;
                        
                        console.log(clickedBarX);

                        let request = {
                            fn: "analytics",
                            id: "analyticsEigenvectorRun",
                            highlight: clickedBarX,
                            target: targetDiv,
                            usr: user
                        }

                        socket.emit("ex", request);
                    });
                    
                    plotIFrame.style.display = "inline-block";
                    const NavBar = document.getElementsByClassName("modebar-container");
                    for (let i = 0; i < NavBar.length; i++) {NavBar[i].style.visibility = "hidden";}
                }

                if (data.id == "analyticsClusteringCoeffPlot") {
                    const config = {displayModeBar: false};
                    const layout = {};
                    let plot_data = JSON.parse(data["val"]);
    
                    Plotly.newPlot(data["target"], plot_data, layout, config);

                    let plotIFrame = document.getElementById(data["target"]);

                    let user = data.usr;
                    let targetDiv = data.target;
                    plotIFrame.on('plotly_click', function(data){
                        if (data.event.button !== 0){return;}

                        let clickedBarX = data.points[0].x;
                        
                        console.log(clickedBarX);

                        let request = {
                            fn: "analytics",
                            id: "analyticsClusteringCoeffRun",
                            highlight: clickedBarX,
                            target: targetDiv,
                            usr: user
                        }

                        socket.emit("ex", request);
                    });
                    
                    plotIFrame.style.display = "inline-block";
                    const NavBar = document.getElementsByClassName("modebar-container");
                    for (let i = 0; i < NavBar.length; i++) {NavBar[i].style.visibility = "hidden";}
                }
                if (data.id == "analyticsPathNode1"){
                    let button = document.getElementById("analyticsPathNode1").shadowRoot.getElementById("name");
                    if (data.val != "init"){
                        button.innerHTML = data.val.name;
                        button.style.color = data.val.color;
                    }
                }
                if (data.id == "analyticsPathNode2"){
                    let button = document.getElementById("analyticsPathNode2").shadowRoot.getElementById("name");
                    if (data.val != "init"){
                        button.innerHTML = data.val.name;
                        button.style.color = data.val.color;
                    }
                }
                
                break;
            case "annotation":
                if (data.id == "annotationOperation"){
                    let value = data.val;
                    if (value == "init"){return}
                    let button = document.getElementById("annotationOperation").shadowRoot.getElementById("name");
                    if (value == true){
                        button.innerHTML = "[-]";
                        document.getElementById("annotation-2").style.display = "inline-block";
                        document.getElementById("annotation-Operations").style.display = "inline-block";
                    }
                    if (value == false){
                        button.innerHTML = "OPERATION";
                        document.getElementById("annotation-2").style.display = "none";
                        document.getElementById("annotation-Operations").style.display = "none";
                    }
                }
                
                break;
            case "func_legend_file":
                if (data.id == "legend_forward") {
                    Legend_switchingFiles_forward(pfile.name);
                } else if (data.id == "legend_backward") {
                    Legend_switchingFiles_backward(pfile.name);
                }

        } 
    });

});


//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


function rgbToHex(red, green, blue) {
    const rgb = (red << 16) | (green << 8) | (blue << 0);
    return '#' + (0x1000000 + rgb).toString(16).slice(1);
}

function removeAllChildNodes(parent) {
    if(parent){
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
    }

}

function settextscroll(id, val) {
    console.log(id)
    var box = document.getElementById(id).shadowRoot.getElementById("box");
    $(box).scrollTop(val[0]);
    $(box).scrollLeft(val[1]);
}

function makeButton(parent, id, text) {
    var r = $('<input/>').attr({type: "button",id: id,value: text});
    $(parent).append(r);
}


function removeOptions(selectElement) {
    var i, L = selectElement.options.length - 1;
    for(i = L; i >= 0; i--) {
       selectElement.remove(i);
    }
 }


 

//-------------------------------------------------------
// CHAT TEXT DISPLAY
//-------------------------------------------------------
function displayChatText(data) {
    const chatOutput = document.getElementById("chatoutput");
    chatOutput.innerHTML += `<div>${data.usr}: ${data.val}</div>`;
    console.log("C_DEBUG:", chatOutput.innerHTML);
}



 
//-------------------------------------------------------
// L E G E N D FUNCTIONS
//-------------------------------------------------------
function Legend_checkFileExists(filepath, callback) {
    fetch(filepath)
      .then(response => {
        if (response.ok) {
          callback(true);
        } else {
          callback(false);
        }
      })
      .catch(error => {
        callback(false);
      });
    return callback;
}


function Legend_checkFileType(fileName) {
    const fileExtension = fileName.split('.').pop().toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif'];
    const htmlExtensions = ['html', 'htm'];

    if (imageExtensions.includes(fileExtension)) {
        return 'image';
    }
    if (htmlExtensions.includes(fileExtension)) {
        return 'html';
    }
    return 'unknown';
}


function Legend_changeImage(project_selected, currentIndex, imageSources) {
  
    console.log("C_DEBUG: IN changeImage - pfile :", project_selected);

    const imageElement = document.getElementById('legend_image');
    const htmlElement = document.getElementById('legend_html');
    const fileType = Legend_checkFileType('static/projects/' + project_selected + '/legends/' + imageSources[currentIndex]);
  
    if (fileType === "image") {
        //console.log("C_DEBUG: changeImage -> in image; currentIndex=", currentIndex);

        imageElement.src = 'static/projects/' + project_selected + '/legends/' + imageSources[currentIndex];
        imageElement.style.display = 'block';
        htmlElement.style.display = 'none';
      
    } else if (fileType === "html") {
        //console.log("C_DEBUG: changeImage -> in html; currentIndex=", currentIndex);

        fetch('static/projects/' + project_selected + '/legends/' + imageSources[currentIndex])
            .then(response => response.text())
            .then(html => {
                htmlElement.srcdoc = html;
                htmlElement.style.display = 'block';

                htmlElement.style.width = htmlElement.parentElement.offsetWidth - 18 + 'px';
                htmlElement.style.height = htmlElement.contentDocument.body.scrollHeight + 20 + 'px';
                imageElement.style.display = 'none';
        });
    }
}


function Legend_switchforward(responseData){
    const nextButton = document.getElementById('legend_forward');
    const backButton = document.getElementById('legend_backward');

    let currentIndex = parseInt(nextButton.getAttribute('val'));
    console.log("C_DEBUG: in switchforward - currentIndex BEFORE add = ", currentIndex);
    currentIndex = (currentIndex + 1) % responseData.legendfiles.length;
    Legend_changeImage(responseData.name, currentIndex, responseData.legendfiles);

    nextButton.setAttribute('val',currentIndex);
    // also set backButton to have same val : 
    backButton.setAttribute('val',currentIndex);

    console.log("C_DEBUG: in switchforward - currentIndex AFTER add = ", currentIndex);
}


function Legend_switchbackward(responseData) {
    const backButton = document.getElementById('legend_backward');
    const nextButton = document.getElementById('legend_forward');

    let currentIndex = parseInt(backButton.getAttribute('val'));
    console.log("C_DEBUG: in switchbackward - currentIndex BEFORE add = ", currentIndex);
    currentIndex =  (currentIndex - 1 + responseData.legendfiles.length) % responseData.legendfiles.length; 
    Legend_changeImage(responseData.name, currentIndex, responseData.legendfiles);

    backButton.setAttribute('val',currentIndex);
    // also set nextButton to have same val : 
    nextButton.setAttribute('val',currentIndex);
    
    console.log("C_DEBUG: in switchbackward - currentIndex AFTER add = ", currentIndex);
}



function Legend_switchingFiles_forward(project_selected) {
    if (document.getElementById('legend_image') && document.getElementById('legend_html')) {

        const legendButtons = document.getElementById('legend_buttons');
        const imageElement = document.getElementById('legend_image');
        const htmlElement = document.getElementById('legend_html');
        
        $.getJSON('static/projects/' + project_selected + '/pfile.json')
            .done(function(responseData) {
                
                if (responseData.legendfiles.length > 0) {
                    legendButtons.style.display = 'flex';
                    document.getElementById('legend_forward').addEventListener("click",Legend_switchforward(responseData));
                
                } else {
                    legendButtons.style.display = 'none';
                    imageElement.style.display = 'none';
                    htmlElement.style.display = 'none';
                }   
            })
            .fail(function() {
                console.log("Failed to retrieve JSON data");
            });
    }
}


function Legend_switchingFiles_backward(project_selected) {
    if (document.getElementById('legend_image') && document.getElementById('legend_html')) {

        const legendButtons = document.getElementById('legend_buttons');
        const imageElement = document.getElementById('legend_image');
        const htmlElement = document.getElementById('legend_html');
        
        $.getJSON('static/projects/' + project_selected + '/pfile.json')
            .done(function(responseData) {
                
                if (responseData.legendfiles.length > 0) {
                    legendButtons.style.display = 'flex';
                    document.getElementById('legend_backward').addEventListener("click", Legend_switchbackward(responseData));
                
                } else {
                    legendButtons.style.display = 'none';
                    imageElement.style.display = 'none';
                    htmlElement.style.display = 'none';
                }   
            })
            .fail(function() {
                console.log("Failed to retrieve JSON data");
            });
    }
}



function Legend_displayfirstFile(project_selected) {
    
    if (document.getElementById('legend_image') && document.getElementById('legend_html')) {

        const p_file = 'static/projects/' + project_selected + '/pfile.json';
        const imageElement = document.getElementById('legend_image');
        const htmlElement = document.getElementById('legend_html');
        
        const legendButtons = document.getElementById('legend_buttons');
        const nextButton = document.getElementById('legend_forward');
        const backButton = document.getElementById('legend_backward');

        $.getJSON(p_file)
            .done(function(data) {
                if (data.hasOwnProperty('legendfiles') && data.legendfiles.length > 0) {

                    const zeroIndex = data.legendfiles[0]
                    const fileType = Legend_checkFileType(zeroIndex);

                    // at new project loaded - set val of both Buttons to zero
                    backButton.setAttribute('val',0);
                    nextButton.setAttribute('val',0);

                    if (fileType == "image") {
                        
                        console.log("C_DEBUG: display FIRST image - in image");

                        imageElement.src = 'static/projects/' + project_selected + '/legends/' + zeroIndex;
                        imageElement.style.display = 'block';
                        legendButtons.style.display = 'flex';

                        htmlElement.style.display = 'none';

                    } 

                    else if (fileType == "html") {
                        
                        //console.log("C_DEBUG: display FIRST image - in html");
                        
                        fetch('static/projects/' + project_selected + '/legends/' + zeroIndex)
                            .then(response => response.text())
                            .then(html => {
                                htmlElement.srcdoc = html; 
                                htmlElement.style.display = 'block';
                                htmlElement.style.width = htmlElement.parentElement.offsetWidth - 18 + 'px';
                                htmlElement.style.height = htmlElement.contentDocument.body.scrollHeight + 20 + 'px';
                                                        
                                legendButtons.style.display = 'flex';
                                imageElement.style.display = 'none';
                            })
                    }
                    
                } else {
                    //console.log("C_DEBUG: in else / hide all");

                    legendButtons.style.display = 'none';
                    imageElement.style.display = 'none';
                    htmlElement.style.display = 'none';

                }
            });
    }
}


//-------------------------------------------------------
// GRAPH INFO DISPLAY 
//-------------------------------------------------------
function Legend_displayGraphInfo(project_selected) {
    if (document.getElementById('graphinfo')) {
        const graphname_file = 'static/projects/' + project_selected + '/pfile.json';
        $.getJSON(graphname_file)
            .done(function(data) {
                let graphtitle = project_selected;
                let graphdescription = "";

                if (data.hasOwnProperty('graphtitle')) {
                    graphtitle = data.graphtitle;
                }

                if (data.hasOwnProperty('graphdesc')) {
                    graphdescription = data.graphdesc;
                }

                const myDiv = document.getElementById("graphinfo");
                myDiv.innerHTML = "<span style='font-size:18px; font-weight:bold'>" + graphtitle +"</span>" + "<br>" + graphdescription;
            })
            .fail(function() {
                const myDiv = document.getElementById("graphinfo");
                myDiv.innerHTML = "";
            });
    }
}


//-------------------------------------------------------
// display color as div
//-------------------------------------------------------
function displayColorAsDiv(color, width, height, marginbottom, margintop) {
    const div = document.createElement('div');
    div.style.width = `${width}px`;
    div.style.height = `${height}px`;
    div.style.backgroundColor = color;

    div.style.marginBottom =`${marginbottom}px`;
    div.style.marginTop =`${margintop}px`;

    div.style.marginRight =`10px`;
    div.style.marginLeft =`10px`;
    div.style.border = '1.5px solid grey';
    return div;

  }



//-------------------------------------------------------
// First NODE/LINK COLOR DESCRIPTION IN LEGEND PANEL
//-------------------------------------------------------
function Legend_displayfirstNodeInfo(project_selected) {
    if (document.getElementById('legendpanel')) {
        const p_file = 'static/projects/'+project_selected+'/pfile.json';

        const nextButton = document.getElementById('forwardstep');
        const backButton = document.getElementById('backwardstep');
        // at new project loaded - set val of both Buttons to zero
        backButton.setAttribute('val',"0");
        nextButton.setAttribute('val',"0");


        $.getJSON(p_file, (pfiledata) => {
            
            const clusterlist = pfiledata["selections"];


            if (clusterlist.length === 0) {
                // W I T H O U T   D E F I N E D   C L U S T E R S (in pfiledata["selectiond"])
                //console.log("C_DEBUG: in clusterlist length is 0");

                const allnode_Div = document.getElementById("legend_node_all");

                const nodedesc_Div = document.getElementById("legend_nodedescription");
                const nodecol_Div = document.getElementById("legend_nodecolor");
                nodedesc_Div.innerHTML = "";
                nodecol_Div.innerHTML = "";
                
                const img_name =  pfiledata["layoutsRGB"][0]; //"nodecolors0RGB";
                const img = new Image();
                img.src = 'static/projects/' + project_selected + '/layoutsRGB/'+ img_name+".png";
        
                const canvas = document.createElement('canvas');
                img.onload = function() {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const pixelData = imageData.data;
                    
                    // Loop through all the pixels in the image
                    const colorsDict = {};
                    const namesDict = {};
                    let index = 1;

                    for (let i = 0; i < pixelData.length; i += 4) {
                        const r = pixelData[i];
                        const g = pixelData[i + 1];
                        const b = pixelData[i + 2];
                        const a = pixelData[i + 3];
                        const colorKey = `${r},${g},${b}`;
                       
                        // If the color key doesn't exist in the dictionary yet, add it
                        if (!colorsDict.hasOwnProperty(colorKey)) {
                            const pixelIndex = i / 4; // Get the pixel index
                            namesDict[pixelIndex] = {"name":"Nodegroup "+index, "nodes": []} //, "color" : []}; // Set the index as the key
                            colorsDict[colorKey] = pixelIndex; // Map the color key to the pixel index
                            index += 1;
                        }
                        const pixelIndex = colorsDict[colorKey]; // Retrieve the pixel index from the color key mapping
                        namesDict[pixelIndex]["nodes"].push(i / 4); 
                    }
                    // Create a new dictionary with the colorKey as the key
                    const newNamesDict = {};
                    for (const pixelIndex in namesDict) {
                            const colorKey = `${pixelData[pixelIndex * 4]},${pixelData[pixelIndex * 4 + 1]},${pixelData[pixelIndex * 4 + 2]}`;
                            newNamesDict[colorKey] = namesDict[pixelIndex];
                        }
                    //console.log("C_DEBUG: newNamesDict: ", newNamesDict);
                    
                    // Loop through the namesDict and create an element for each node
                    for (const color in newNamesDict) {
                        //const [r, g, b] = color.split(',');
                    
                        // Check if the color is non-black
                        if (color != "0,0,0") {
                            //console.log("C_DEBUG: color not black: ", color);
                            const color_reformated = 'rgb(' + color + ')';                            
                            const textdiv = document.createElement("div");
                            const text = document.createTextNode(newNamesDict[color]["name"]);
                            textdiv.style.fontSize="14px";
                            textdiv.style.lineHeight="24px"; // this should be same as colorImg.height+colorImg.marginBottom
                            textdiv.appendChild(text);
                            nodedesc_Div.appendChild(textdiv);
                            const colorImg = displayColorAsDiv(color_reformated, 18.5, 18.5, 5.5, 0); 
                            nodecol_Div.appendChild(colorImg);
                        } 
                    } 
                    allnode_Div.appendChild(nodecol_Div);
                    allnode_Div.appendChild(nodedesc_Div);  
                    
                };
  
            } else {
                // W I T H   D E F I N E D   C L U S T E R S 
                //console.log("C_DEBUG: in clusterlist length is: ", clusterlist.length);

                const allnode_Div = document.getElementById("legend_node_all");

                const nodedesc_Div = document.getElementById("legend_nodedescription");
                const nodecol_Div = document.getElementById("legend_nodecolor");

                nodedesc_Div.innerHTML = "";
                nodecol_Div.innerHTML = "";

                // Use Promise.all to wait for all images to load before processing them
                Promise.all(clusterlist.map((cluster) => {
                    const nodeID = cluster.nodes[0];
                    const img_name =  pfiledata["layoutsRGB"][0]; //"nodecolors0RGB";
                    const img = new Image();
                    img.src = 'static/projects/' + project_selected + '/layoutsRGB/'+ img_name+".png";
        
                    return new Promise((resolve, reject) => {
                        img.onload = () => {
                            const canvas = document.createElement("canvas");
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext("2d");
                            ctx.drawImage(img, 0, 0);
                            const imageData = ctx.getImageData(nodeID, 0, canvas.width, canvas.height); // x = nodeID, y = 0
                            const colorData = imageData.data;
                            const color = 'rgb(' + colorData[0] + ', ' + colorData[1] + ', ' + colorData[2] + ')';
                            resolve({cluster: cluster, color: color});
                        };
                        img.onerror = reject;
                    });
                }))
                .then((results) => {
                    // sort the results by the order of clusterlist
                    const sortedResults = results.sort((a, b) => {
                        return clusterlist.indexOf(a.cluster) - clusterlist.indexOf(b.cluster);
                    });
                    sortedResults.forEach((result) => {
                        const textdiv = document.createElement("div");
                        textdiv.style.fontSize="14px";
                        textdiv.style.lineHeight="24px"; 
                        const text = document.createTextNode(result.cluster["name"]);
                        textdiv.appendChild(text);
                        nodedesc_Div.appendChild(textdiv);

                        const colorImg = displayColorAsDiv(result.color, 18.5,18.5, 5.5, 0);
                        nodecol_Div.appendChild(colorImg);

                    });
                    allnode_Div.appendChild(nodecol_Div);
                    allnode_Div.appendChild(nodedesc_Div);
                })
                .catch((err) => {
                    console.log("Error: Could not load image: " + err);
                });    
            }
        })
        .fail(function() {
            console.log("Error: Could not load JSON file");
        });
    }
}


  
function Legend_displayfirstLinkInfo(project_selected) {
    if (document.getElementById('legendpanel')) {
        const p_file = 'static/projects/'+project_selected+'/pfile.json';

        const alllink_Div = document.getElementById("legend_link_all");

        $.getJSON(p_file, (pfiledata) => {

            const clusterlist = pfiledata["selections"];
            const linkdesc_Div = document.getElementById("legend_linkdescription");
            const linkcol_Div = document.getElementById("legend_linkcolor");
            linkdesc_Div.innerHTML = "";
            linkcol_Div.innerHTML = "";

            const img_name =  pfiledata["linksRGB"][0]; 
            const img = new Image();
            img.src = 'static/projects/' + project_selected + '/linksRGB/'+ img_name+".png";
    
            const canvas = document.createElement('canvas');
            img.onload = function() {
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const pixelData = imageData.data;
                
                // Loop through all the pixels in the image
                const colorsDict = {};
                const namesDict = {};
                let index = 1;

                for (let i = 0; i < pixelData.length; i += 4) {
                    const r = pixelData[i];
                    const g = pixelData[i + 1];
                    const b = pixelData[i + 2];
                    const a = pixelData[i + 3];
                    const colorKey = `${r},${g},${b}`;
                    
                    // If the color key doesn't exist in the dictionary yet, add it
                    
                    if (!colorsDict.hasOwnProperty(colorKey)) {
                        const pixelIndex = i / 4; // Get the pixel index
                        namesDict[pixelIndex] = {"name":"Connections ", //+index, 
                                                "nodes": []} //, "color" : []}; // Set the index as the key
                        colorsDict[colorKey] = pixelIndex; // Map the color key to the pixel index
                        index += 1;
                    }
                    const pixelIndex = colorsDict[colorKey]; // Retrieve the pixel index from the color key mapping
                    namesDict[pixelIndex]["nodes"].push(i / 4); 
                }
                // Create a new dictionary with the colorKey as the key
                const newNamesDict = {};
                for (const pixelIndex in namesDict) {
                        const colorKey = `${pixelData[pixelIndex * 4]},${pixelData[pixelIndex * 4 + 1]},${pixelData[pixelIndex * 4 + 2]}`;
                        newNamesDict[colorKey] = namesDict[pixelIndex];
                    }
                // console.log("C_DEBUG: newNamesDict: ", newNamesDict);
                
                // Loop through the namesDict and create an element for each node
                for (const color in newNamesDict) {
                       if (color != '0,0,0') {
                        const color_reformated = 'rgb(' + color + ')';    

                        const colorImg = displayColorAsDiv(color_reformated,  18.5,18.5, 5.5, 0);//30, 5, 0, 0); // 20px 20px square
                        linkcol_Div.appendChild(colorImg);
                    
                        const textdiv = document.createElement("div");
                        textdiv.style.fontSize="14px";
                        textdiv.style.lineHeight="24px"; // this should be same as colorImg.height+colorImg.marginBottom
                        const text = document.createTextNode(newNamesDict[color]["name"]);
                        textdiv.appendChild(text);
                        linkdesc_Div.appendChild(textdiv);
                    } 
                    alllink_Div.appendChild(linkcol_Div);
                    alllink_Div.appendChild(linkdesc_Div);
                }
            };

        })
        .fail(function() {
            console.log("Error: Could not load JSON file");
        });
    }
}



//-------------------------------------------------------
// PER LAYOUT : NODE/LINK COLOR DESCRIPTION IN LEGEND PANEL
//-------------------------------------------------------

// forward button adding index
function NEWIndexforwardstep(data){
    const nextButton = document.getElementById('forwardstep');
    const backButton = document.getElementById('backwardstep');

    let currentIndex = parseInt(nextButton.getAttribute('val'));
    currentIndex = (currentIndex + 1) % data;

    nextButton.setAttribute('val',currentIndex);
    backButton.setAttribute('val',currentIndex);
    //console.log("C_DEBUG: NEWIndexforwardstep value = ", currentIndex)

    return currentIndex;
}

// status of button without adding index
function getIndexforwardstep(data){
    const nextButton = document.getElementById('forwardstep');
    let currentIndex = parseInt(nextButton.getAttribute('val'));
    //console.log("C_DEBUG: getIndexforwardstep value = ", currentIndex)

    return currentIndex;
}

// backward button subtracting index 
function NEWIndexbackwardstep(data) {
    const backButton = document.getElementById('backwardstep');
    const nextButton = document.getElementById('forwardstep');

    let currentIndex = parseInt(backButton.getAttribute('val'));
    currentIndex =  (currentIndex - 1 + data) % data;

    backButton.setAttribute('val',currentIndex);
    nextButton.setAttribute('val',currentIndex);
    //console.log("C_DEBUG: NEWIndexbackwardstep value = ", currentIndex)

    return currentIndex;
}

function getIndexbackwardstep(data) {
    const backButton = document.getElementById('backwardstep');
    let currentIndex = parseInt(backButton.getAttribute('val'));
    //console.log("C_DEBUG: getIndexbackwardstep value = ", currentIndex)

    return currentIndex;
}



function Legend_displayNodeLinkInfo_forward(project_selected) {
    if (document.getElementById('legendpanel')) {
        const p_file = 'static/projects/'+project_selected+'/pfile.json';
        const alllink_Div = document.getElementById("legend_link_all");

        $.getJSON(p_file, (pfiledata) => {
                
            const clusterlist = pfiledata["selections"];
            forwardidx = NEWIndexforwardstep(pfiledata.layoutsRGB.length);
            //console.log("C_DEBUG: NODE/LINK forwardidx = ", forwardidx);

            // -------------------------------
            // L I N K S  
            // -------------------------------
            const linkdesc_Div = document.getElementById("legend_linkdescription");
            const linkcol_Div = document.getElementById("legend_linkcolor");
            linkdesc_Div.innerHTML = "";
            linkcol_Div.innerHTML = "";

            // WIP - currently temp fix: catch if there are more node color files than link color files
            if (pfiledata.layoutsRGB.length > pfiledata.linksRGB.length) {
                const img_name = pfiledata["linksRGB"][0]; 
                img = new Image();
                img.src = 'static/projects/' + project_selected + '/linksRGB/'+ img_name+".png";
                //console.log("C_DEBUG: forwardidx > linksRGB.length.");

            } else {
                const img_name = pfiledata["linksRGB"][forwardidx]; 
                img = new Image();
                img.src = 'static/projects/' + project_selected + '/linksRGB/'+ img_name+".png";
                //console.log("C_DEBUG: forwardidx - in else.");

            }

            const canvas = document.createElement('canvas');
            img.onload = function() {
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const pixelData = imageData.data;
                
                // Loop through all the pixels in the image
                const colorsDict = {};
                const namesDict = {};
                let index = 1;

                for (let i = 0; i < pixelData.length; i += 4) {
                    const r = pixelData[i];
                    const g = pixelData[i + 1];
                    const b = pixelData[i + 2];
                    const a = pixelData[i + 3];
                    const colorKey = `${r},${g},${b}`;
                    
                    // If the color key doesn't exist in the dictionary yet, add it
                    
                    if (!colorsDict.hasOwnProperty(colorKey)) {
                        const pixelIndex = i / 4; // Get the pixel index
                        namesDict[pixelIndex] = {"name":"Connections ", //+index, 
                                                "nodes": []} //, "color" : []}; // Set the index as the key
                        colorsDict[colorKey] = pixelIndex; // Map the color key to the pixel index
                        index += 1;
                    }
                    const pixelIndex = colorsDict[colorKey]; // Retrieve the pixel index from the color key mapping
                    namesDict[pixelIndex]["nodes"].push(i / 4); 
                }
                // Create a new dictionary with the colorKey as the key
                const newNamesDict = {};
                for (const pixelIndex in namesDict) {
                        const colorKey = `${pixelData[pixelIndex * 4]},${pixelData[pixelIndex * 4 + 1]},${pixelData[pixelIndex * 4 + 2]}`;
                        newNamesDict[colorKey] = namesDict[pixelIndex];
                    }
                // console.log("C_DEBUG: newNamesDict: ", newNamesDict);
                
                // Loop through the namesDict and create an element for each node
                for (const color in newNamesDict) {
                       if (color != '0,0,0') {
                        const color_reformated = 'rgb(' + color + ')';    

                        const colorImg = displayColorAsDiv(color_reformated,  18.5,18.5, 5.5, 0);//30, 5, 0, 0); // 20px 20px square
                        linkcol_Div.appendChild(colorImg);
                    
                        const textdiv = document.createElement("div");
                        textdiv.style.fontSize="14px";
                        textdiv.style.lineHeight="24px"; // this should be same as colorImg.height+colorImg.marginBottom
                        const text = document.createTextNode(newNamesDict[color]["name"]);
                        textdiv.appendChild(text);
                        linkdesc_Div.appendChild(textdiv);
                    } 
                    alllink_Div.appendChild(linkcol_Div);
                    alllink_Div.appendChild(linkdesc_Div);
                }
            };

            // -------------------------------
            // N O D E S 
            // ------------------------------- 
            if (clusterlist.length === 0) {
                // W I T H O U T   D E F I N E D   C L U S T E R S (in pfiledata["selectiond"])
                //console.log("C_DEBUG: in clusterlist length is 0");

                const allnode_Div = document.getElementById("legend_node_all");

                const nodedesc_Div = document.getElementById("legend_nodedescription");
                const nodecol_Div = document.getElementById("legend_nodecolor");
                nodedesc_Div.innerHTML = "";
                nodecol_Div.innerHTML = "";
                
                const img_name =  pfiledata["layoutsRGB"][forwardidx]; //"nodecolors0RGB";
                const img = new Image();
                img.src = 'static/projects/' + project_selected + '/layoutsRGB/'+ img_name+".png";
        
                const canvas = document.createElement('canvas');
                img.onload = function() {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const pixelData = imageData.data;
                    
                    // Loop through all the pixels in the image
                    const colorsDict = {};
                    const namesDict = {};
                    let index = 1;

                    for (let i = 0; i < pixelData.length; i += 4) {
                        const r = pixelData[i];
                        const g = pixelData[i + 1];
                        const b = pixelData[i + 2];
                        const a = pixelData[i + 3];
                        const colorKey = `${r},${g},${b}`;
                       
                        // If the color key doesn't exist in the dictionary yet, add it
                        if (!colorsDict.hasOwnProperty(colorKey)) {
                            const pixelIndex = i / 4; // Get the pixel index
                            namesDict[pixelIndex] = {"name":"Nodegroup "+index, "nodes": []} //, "color" : []}; // Set the index as the key
                            colorsDict[colorKey] = pixelIndex; // Map the color key to the pixel index
                            index += 1;
                        }
                        const pixelIndex = colorsDict[colorKey]; // Retrieve the pixel index from the color key mapping
                        namesDict[pixelIndex]["nodes"].push(i / 4); 
                    }
                    // Create a new dictionary with the colorKey as the key
                    const newNamesDict = {};
                    for (const pixelIndex in namesDict) {
                            const colorKey = `${pixelData[pixelIndex * 4]},${pixelData[pixelIndex * 4 + 1]},${pixelData[pixelIndex * 4 + 2]}`;
                            newNamesDict[colorKey] = namesDict[pixelIndex];
                        }
                    //console.log("C_DEBUG: newNamesDict: ", newNamesDict);
                    
                    // Loop through the namesDict and create an element for each node
                    for (const color in newNamesDict) {
                        //const [r, g, b] = color.split(',');
                    
                        // Check if the color is non-black
                        if (color != "0,0,0") {
                            //console.log("C_DEBUG: color not black: ", color);
                            const color_reformated = 'rgb(' + color + ')';                            
                            const textdiv = document.createElement("div");
                            const text = document.createTextNode(newNamesDict[color]["name"]);
                            textdiv.style.fontSize="14px";
                            textdiv.style.lineHeight="24px"; // this should be same as colorImg.height+colorImg.marginBottom
                            textdiv.appendChild(text);
                            nodedesc_Div.appendChild(textdiv);
                            const colorImg = displayColorAsDiv(color_reformated, 18.5, 18.5, 5.5, 0); 
                            nodecol_Div.appendChild(colorImg);
                        } 
                    } 
                    allnode_Div.appendChild(nodecol_Div);
                    allnode_Div.appendChild(nodedesc_Div);  
                    
                };
  
            } else {
                // W I T H   D E F I N E D   C L U S T E R S 
                //console.log("C_DEBUG: in clusterlist length is: ", clusterlist.length);

                const allnode_Div = document.getElementById("legend_node_all");

                const nodedesc_Div = document.getElementById("legend_nodedescription");
                const nodecol_Div = document.getElementById("legend_nodecolor");

                nodedesc_Div.innerHTML = "";
                nodecol_Div.innerHTML = "";

                // Use Promise.all to wait for all images to load before processing them
                Promise.all(clusterlist.map((cluster) => {
                    const nodeID = cluster.nodes[0];
                    const img_name =  pfiledata["layoutsRGB"][forwardidx]; //"nodecolors0RGB";
                    const img = new Image();
                    img.src = 'static/projects/' + project_selected + '/layoutsRGB/'+ img_name+".png";
        
                    return new Promise((resolve, reject) => {
                        img.onload = () => {
                            const canvas = document.createElement("canvas");
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext("2d");
                            ctx.drawImage(img, 0, 0);
                            const imageData = ctx.getImageData(nodeID, 0, canvas.width, canvas.height); // x = nodeID, y = 0
                            const colorData = imageData.data;
                            const color = 'rgb(' + colorData[0] + ', ' + colorData[1] + ', ' + colorData[2] + ')';
                            resolve({cluster: cluster, color: color});
                        };
                        img.onerror = reject;
                    });
                }))
                .then((results) => {
                    // sort the results by the order of clusterlist
                    const sortedResults = results.sort((a, b) => {
                        return clusterlist.indexOf(a.cluster) - clusterlist.indexOf(b.cluster);
                    });
                    sortedResults.forEach((result) => {
                        const textdiv = document.createElement("div");
                        textdiv.style.fontSize="14px";
                        textdiv.style.lineHeight="24px"; 
                        const text = document.createTextNode(result.cluster["name"]);
                        textdiv.appendChild(text);
                        nodedesc_Div.appendChild(textdiv);

                        const colorImg = displayColorAsDiv(result.color, 18.5,18.5, 5.5, 0);
                        nodecol_Div.appendChild(colorImg);

                    });
                    allnode_Div.appendChild(nodecol_Div);
                    allnode_Div.appendChild(nodedesc_Div);
                })
                .catch((err) => {
                    console.log("Error: Could not load image: " + err);
                });    
            }
        })
        .fail(function() {
            console.log("Error: Could not load JSON file");
        });
    }
}



function Legend_displayNodeLinkInfo_backward(project_selected) {
    if (document.getElementById('legendpanel')) {
        const p_file = 'static/projects/'+project_selected+'/pfile.json';
        
        const alllink_Div = document.getElementById("legend_link_all");

        $.getJSON(p_file, (pfiledata) => {
                
            const clusterlist = pfiledata["selections"];
            backwardidx = NEWIndexbackwardstep(pfiledata.layoutsRGB.length);
            //console.log("C_DEBUG: NODE/LINK backwardidx = ", backwardidx);

            
            // -------------------------------
            // L I N K S 
            // -------------------------------
            const linkdesc_Div = document.getElementById("legend_linkdescription");
            const linkcol_Div = document.getElementById("legend_linkcolor");
            linkdesc_Div.innerHTML = "";
            linkcol_Div.innerHTML = "";

            // WIP - currently temp fix: catch if there are more node color files than link color files
            if (pfiledata.layoutsRGB.length > pfiledata.linksRGB.length) {
                const img_name = pfiledata["linksRGB"][0]; 
                img = new Image();
                img.src = 'static/projects/' + project_selected + '/linksRGB/'+ img_name+".png";
                //console.log("C_DEBUG: backwardidx > linksRGB.length.");
            } else {
                const img_name = pfiledata["linksRGB"][backwardidx]; 
                img = new Image();
                img.src = 'static/projects/' + project_selected + '/linksRGB/'+ img_name+".png";
                //console.log("C_DEBUG: backwardidx - in else.");
            }

            const canvas = document.createElement('canvas');
            img.onload = function() {
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const pixelData = imageData.data;
                
                // Loop through all the pixels in the image
                const colorsDict = {};
                const namesDict = {};
                let index = 1;

                for (let i = 0; i < pixelData.length; i += 4) {
                    const r = pixelData[i];
                    const g = pixelData[i + 1];
                    const b = pixelData[i + 2];
                    const a = pixelData[i + 3];
                    const colorKey = `${r},${g},${b}`;
                    
                    // If the color key doesn't exist in the dictionary yet, add it
                    
                    if (!colorsDict.hasOwnProperty(colorKey)) {
                        const pixelIndex = i / 4; // Get the pixel index
                        namesDict[pixelIndex] = {"name":"Connections ", //+index, 
                                                "nodes": []} //, "color" : []}; // Set the index as the key
                        colorsDict[colorKey] = pixelIndex; // Map the color key to the pixel index
                        index += 1;
                    }
                    const pixelIndex = colorsDict[colorKey]; // Retrieve the pixel index from the color key mapping
                    namesDict[pixelIndex]["nodes"].push(i / 4); 
                }
                // Create a new dictionary with the colorKey as the key
                const newNamesDict = {};
                for (const pixelIndex in namesDict) {
                        const colorKey = `${pixelData[pixelIndex * 4]},${pixelData[pixelIndex * 4 + 1]},${pixelData[pixelIndex * 4 + 2]}`;
                        newNamesDict[colorKey] = namesDict[pixelIndex];
                    }
                // console.log("C_DEBUG: newNamesDict: ", newNamesDict);
                
                // Loop through the namesDict and create an element for each node
                for (const color in newNamesDict) {
                       if (color != '0,0,0') {
                        const color_reformated = 'rgb(' + color + ')';    

                        const colorImg = displayColorAsDiv(color_reformated,  18.5,18.5, 5.5, 0);//30, 5, 0, 0); // 20px 20px square
                        linkcol_Div.appendChild(colorImg);
                    
                        const textdiv = document.createElement("div");
                        textdiv.style.fontSize="14px";
                        textdiv.style.lineHeight="24px"; // this should be same as colorImg.height+colorImg.marginBottom
                        const text = document.createTextNode(newNamesDict[color]["name"]);
                        textdiv.appendChild(text);
                        linkdesc_Div.appendChild(textdiv);
                    } 
                    alllink_Div.appendChild(linkcol_Div);
                    alllink_Div.appendChild(linkdesc_Div);
                }
            };


            // -------------------------------
            // N O D E S 
            // -------------------------------
            if (clusterlist.length === 0) {
                // W I T H O U T   D E F I N E D   C L U S T E R S (in pfiledata["selectiond"])
                //console.log("C_DEBUG: in clusterlist length is 0");

                const allnode_Div = document.getElementById("legend_node_all");

                const nodedesc_Div = document.getElementById("legend_nodedescription");
                const nodecol_Div = document.getElementById("legend_nodecolor");
                nodedesc_Div.innerHTML = "";
                nodecol_Div.innerHTML = "";
                
                const img_name =  pfiledata["layoutsRGB"][backwardidx]; //"nodecolors0RGB";
                const img = new Image();
                img.src = 'static/projects/' + project_selected + '/layoutsRGB/'+ img_name+".png";
        
                const canvas = document.createElement('canvas');
                img.onload = function() {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const pixelData = imageData.data;
                    
                    // Loop through all the pixels in the image
                    const colorsDict = {};
                    const namesDict = {};
                    let index = 1;

                    for (let i = 0; i < pixelData.length; i += 4) {
                        const r = pixelData[i];
                        const g = pixelData[i + 1];
                        const b = pixelData[i + 2];
                        const a = pixelData[i + 3];
                        const colorKey = `${r},${g},${b}`;
                       
                        // If the color key doesn't exist in the dictionary yet, add it
                        if (!colorsDict.hasOwnProperty(colorKey)) {
                            const pixelIndex = i / 4; // Get the pixel index
                            namesDict[pixelIndex] = {"name":"Nodegroup "+index, "nodes": []} //, "color" : []}; // Set the index as the key
                            colorsDict[colorKey] = pixelIndex; // Map the color key to the pixel index
                            index += 1;
                        }
                        const pixelIndex = colorsDict[colorKey]; // Retrieve the pixel index from the color key mapping
                        namesDict[pixelIndex]["nodes"].push(i / 4); 
                    }
                    // Create a new dictionary with the colorKey as the key
                    const newNamesDict = {};
                    for (const pixelIndex in namesDict) {
                            const colorKey = `${pixelData[pixelIndex * 4]},${pixelData[pixelIndex * 4 + 1]},${pixelData[pixelIndex * 4 + 2]}`;
                            newNamesDict[colorKey] = namesDict[pixelIndex];
                        }
                    //console.log("C_DEBUG: newNamesDict: ", newNamesDict);
                    
                    // Loop through the namesDict and create an element for each node
                    for (const color in newNamesDict) {
                        //const [r, g, b] = color.split(',');
                    
                        // Check if the color is non-black
                        if (color != "0,0,0") {
                            //console.log("C_DEBUG: color not black: ", color);
                            const color_reformated = 'rgb(' + color + ')';                            
                            const textdiv = document.createElement("div");
                            const text = document.createTextNode(newNamesDict[color]["name"]);
                            textdiv.style.fontSize="14px";
                            textdiv.style.lineHeight="24px"; // this should be same as colorImg.height+colorImg.marginBottom
                            textdiv.appendChild(text);
                            nodedesc_Div.appendChild(textdiv);
                            const colorImg = displayColorAsDiv(color_reformated, 18.5, 18.5, 5.5, 0); 
                            nodecol_Div.appendChild(colorImg);
                        } 
                    } 
                    allnode_Div.appendChild(nodecol_Div);
                    allnode_Div.appendChild(nodedesc_Div);  
                    
                };
  
            } else {
                // W I T H   D E F I N E D   C L U S T E R S 
                //console.log("C_DEBUG: in clusterlist length is: ", clusterlist.length);

                const allnode_Div = document.getElementById("legend_node_all");

                const nodedesc_Div = document.getElementById("legend_nodedescription");
                const nodecol_Div = document.getElementById("legend_nodecolor");

                nodedesc_Div.innerHTML = "";
                nodecol_Div.innerHTML = "";

                // Use Promise.all to wait for all images to load before processing them
                Promise.all(clusterlist.map((cluster) => {
                    const nodeID = cluster.nodes[0];
                    const img_name =  pfiledata["layoutsRGB"][backwardidx]; //"nodecolors0RGB";
                    const img = new Image();
                    img.src = 'static/projects/' + project_selected + '/layoutsRGB/'+ img_name+".png";
        
                    return new Promise((resolve, reject) => {
                        img.onload = () => {
                            const canvas = document.createElement("canvas");
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext("2d");
                            ctx.drawImage(img, 0, 0);
                            const imageData = ctx.getImageData(nodeID, 0, canvas.width, canvas.height); // x = nodeID, y = 0
                            const colorData = imageData.data;
                            const color = 'rgb(' + colorData[0] + ', ' + colorData[1] + ', ' + colorData[2] + ')';
                            resolve({cluster: cluster, color: color});
                        };
                        img.onerror = reject;
                    });
                }))
                .then((results) => {
                    // sort the results by the order of clusterlist
                    const sortedResults = results.sort((a, b) => {
                        return clusterlist.indexOf(a.cluster) - clusterlist.indexOf(b.cluster);
                    });
                    sortedResults.forEach((result) => {
                        const textdiv = document.createElement("div");
                        textdiv.style.fontSize="14px";
                        textdiv.style.lineHeight="24px"; 
                        const text = document.createTextNode(result.cluster["name"]);
                        textdiv.appendChild(text);
                        nodedesc_Div.appendChild(textdiv);

                        const colorImg = displayColorAsDiv(result.color, 18.5,18.5, 5.5, 0);
                        nodecol_Div.appendChild(colorImg);

                    });
                    allnode_Div.appendChild(nodecol_Div);
                    allnode_Div.appendChild(nodedesc_Div);
                })
                .catch((err) => {
                    console.log("Error: Could not load image: " + err);
                });    
            }
        })
        .fail(function() {
            console.log("Error: Could not load JSON file");
        });
    }
}


//-------------------------------------------------------
// GRAPH LAYOUT DISPLAY 
//-------------------------------------------------------
function Legend_displayfirstGraphLayout(project_selected) {
    if (document.getElementById('graphlayout')) {
        const graphname_file = 'static/projects/' + project_selected + '/pfile.json';
        $.getJSON(graphname_file)
            .done(function(pfiledata) {

                if (pfiledata.hasOwnProperty('layouts')) {
                    graphlayout_pre = pfiledata.layouts[0];
                    graphlayout = graphlayout_pre.slice(0, -3);
                }
                const myDiv = document.getElementById("graphlayout");
                myDiv.innerHTML = graphlayout;
            })
            .fail(function() {
                const myDiv = document.getElementById("graphlayout");
                myDiv.style.display = "none";
                myDiv.innerHTML = "";
            });
    }
}

function Legend_displayGraphLayout_backward(project_selected) {
    if (document.getElementById('graphlayout')) {
        const graphname_file = 'static/projects/' + project_selected + '/pfile.json';
        $.getJSON(graphname_file)
            .done(function(pfiledata) {

                backwardidx = getIndexbackwardstep(pfiledata.layouts.length);

                if (pfiledata.hasOwnProperty('layouts')) {
                    graphlayout_pre = pfiledata.layouts[backwardidx];
                    graphlayout = graphlayout_pre.slice(0, -3);
                }
                const myDiv = document.getElementById("graphlayout");
                myDiv.innerHTML = graphlayout;
            })
            .fail(function() {
                const myDiv = document.getElementById("graphlayout");
                myDiv.style.display = "none";
                myDiv.innerHTML = "";
            });
    }
}

function Legend_displayGraphLayout_forward(project_selected) {
    if (document.getElementById('graphlayout')) {
        const graphname_file = 'static/projects/' + project_selected + '/pfile.json';
        $.getJSON(graphname_file)
            .done(function(pfiledata) {

                forwardidx = getIndexforwardstep(pfiledata.layouts.length);

                if (pfiledata.hasOwnProperty('layouts')) {
                    graphlayout_pre = pfiledata.layouts[forwardidx];
                    graphlayout = graphlayout_pre.slice(0, -3)
                }
                const myDiv = document.getElementById("graphlayout");
                myDiv.innerHTML = graphlayout;
            })
            .fail(function() {
                const myDiv = document.getElementById("graphlayout");
                myDiv.style.display = "none";
                myDiv.innerHTML = "";
            });
    }
}
