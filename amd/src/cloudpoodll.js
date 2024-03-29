
/**
 * root is our root object context, ie. window if we are in a browser
 * factory is a method that builds and returns our module
 */
(function(root, factory) {
    // If AMD is available, use the define() method to load our dependencies
    //and declare our module
    if (typeof define === 'function' && define.amd) {
        define([], function() {
            return factory(root);
        });
    }
    // Otherwise we will attach our module to root, and pass references to our
    // dependencies into the factory. We're assuming that our dependencies are
    // also attached to root here, but they could come from anywhere
    else
    {
        root.CloudPoodll = factory(root);
    }
})(this, function(root) {
    // This is our factory method. Return our module object here...
    return {
        version: '1.3.3',
        baseURL: 'https://cloud.poodll.com/local/cpapi/fastpoodllloader.php',
        //baseURL: 'http://localhost/moodle/local/cpapi/fastpoodllloader.php',
        params: ['parent','appid','timelimit','type','media','updatecontrol','width','height','id',
            'iframeclass','transcode','transcoder','transcribe','subtitle','language','transcribevocab',
            'expiredays','owner','region','token','localloader','localloading','notificationurl',
            'sourcemimetype','speechevents','hints','alreadyparsed','fallback'],

        fetchContainers: function(classname){
            var divs = document.getElementsByClassName(classname);
            return divs;
        },
        autoCreateRecorders: function(classname){
            if(!classname){classname='cloudpoodll';}
            var containers = this.fetchContainers(classname);
            for(var ctr=0;ctr<containers.length;ctr++){
                this.insertRecorder(containers[ctr]);
            }
        },
        createRecorder: function(elementid){
            var theelement=document.getElementById(elementid);
            this.insertRecorder(theelement);
        },

        insertRecorder: function(container, attributes){
            if(attributes == undefined) {
                attributes = this.parseAttributes(container);
            }
            var iframe = this.createIframe(attributes);
            if(iframe) {
                container.appendChild(iframe);
                container.setAttribute('data-alreadyparsed','true');
            }
        },
        parseAttributes: function(container){
            var attributes = {};
            for(var i=0;i<this.params.length;i++){
                var attr = container.getAttribute('data-' + this.params[i]);
                if(attr!==null){
                    attributes[this.params[i]]=attr;
                }
            }
            return attributes;
        },
        createIframe: function(attributes){

            //cancel out if this div was already processed
            if(attributes.hasOwnProperty('alreadyparsed') ){
                if(attributes['alreadyparsed']=='true'){
                   // console.log("Can only parse a cloudpoodll element once. Cancelling.");
                    return false;
                }
            }

            //fix up default attributes if the user did not set them
            //parent
            if(!attributes.hasOwnProperty('parent') ){
                attributes['parent']=window.location.protocol + '//' + window.location.hostname;
            }
            //media
            if(!attributes.hasOwnProperty('media') ){
                attributes['media']='audio';
            }
            //also store predicted mimetype
            attributes['sourcemimetype'] = this.guess_mimetype(attributes['media'],attributes['transcribe'],attributes['hints']);

            //build and set the iframe src url
            var iframe = document.createElement('iframe');

            //set up the base URL for the iframe
            //if we need and can load locally from html we do that
            if(!attributes.hasOwnProperty('localloader')){
                var localloading = 'never';
            }else {
                var localloading = attributes.hasOwnProperty('localloading') ? attributes['localloading'] : 'auto';
            }

            switch(localloading){

                case 'always':
                    var iframeurl = attributes['parent'] + attributes['localloader'] + '?';
                    break;

                case 'never':
                    var iframeurl = this.baseURL + '?';
                    break;

                case 'auto':
                default:
                    var isIOS_safari = this.is_ios() || this.is_safari();
                    if(isIOS_safari) {
                        var iframeurl = attributes['parent'] + attributes['localloader'] + '?';
                    }else {
                        var iframeurl = this.baseURL + '?';
                    }
                    break;
            }

            //build iframeurl based on baseurl and attributes
            for (var property in attributes) {
                iframeurl = iframeurl + property + '=' + attributes[property] + '&';
            }
            iframe.setAttribute('src', iframeurl);

            //do any iframe attributes that we need to
            //width and height (only if no iframe class specified)
            //see here for responsive iframe ..https://blog.theodo.fr/2018/01/responsive-iframes-css-trick/
            if(attributes.hasOwnProperty('iframeclass')) {
                iframe.setAttribute('class', attributes.iframeclass);
            }else{
                if(!attributes.hasOwnProperty('width') ){
                    attributes['width']=350;
                }
                iframe.setAttribute('width', attributes.width);
                if(!attributes.hasOwnProperty('height') ){
                    if(attributes['media']=='audio') {
                        attributes['height'] = 250;
                    }else{
                        attributes['height'] = 550;
                    }
                }
                iframe.setAttribute('height', attributes.height);
            }
            iframe.setAttribute('frameBorder', 0);
            iframe.setAttribute('allow', 'camera; microphone; display-capture');
            return iframe;
        },
        theCallback: function(data) {
            switch(data.type){
                case 'filesubmitted':
                    var inputControl = data.updatecontrol;
                    var pokeInput = document.getElementById(inputControl);
                    var theurl = data.mediaurl;
                    if (pokeInput) {
                        pokeInput.value = theurl;
                    }
                    break;
                case 'error':
                    alert('ERROR:' . data.message);
            }
        },
        initEvents: function(){
            var that = this;
            window.addEventListener('message', function(e) {
                var data = e.data;
                if (data && data.hasOwnProperty('id') && data.hasOwnProperty('type')){
                    that.theCallback(data);
                }
            });
        },
        sendMessage: function(containerid,messageObject){

            if(!messageObject.hasOwnProperty('type')){
                //'All message objects must have at least the "type" property'
                return;
            }

            var theiframe = document.getElementById(containerid).getElementsByTagName('iframe')[0];

            //messageObject.id = this.id;
            theiframe.contentWindow.postMessage(messageObject);

        },
        fetchroot: function(){
            return root;
        },

        is_safari: function(){
            return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        },

        is_ios: function(){
            return  /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        },

        guess_mimetype: function(mediatype, transcribe, hints){

            //if we are using Google Cloud Speech Transcribe then we only support audio/wav
            if(transcribe==2){
                return "audio/wav";
            }
            //this is a bit hacky, we should base64decode hints and look for the value of hints.encoder
            if(hints && hints.includes('stereoaudio')){
                return "audio/wav";
            }

            var nVer = navigator.appVersion;
            var nAgt = navigator.userAgent;
            var browserName  = navigator.appName;
            //decided no real benefit and some danger in detecting version, so commented it mostly
            var fullVersion  = ''+parseFloat(navigator.appVersion);
            var nameOffset,verOffset,ix;

            if(nAgt.match('(?:Edge|EdgA|EdgiOS)')!==null) {
                browserName="Edge";
                //dont know how to get this and its probably not important yet
                //fullVersion = '1.0';

            // In Opera, the true version is after "Opera" or after "Version"
            }else if ((verOffset=nAgt.indexOf("Opera"))!=-1) {
                browserName = "Opera";
                //fullVersion = nAgt.substring(verOffset+6);
                //if ((verOffset=nAgt.indexOf("Version"))!=-1) fullVersion = nAgt.substring(verOffset+8);
            }
            // In MSIE, the true version is after "MSIE" in userAgent
            else if ((verOffset=nAgt.indexOf("MSIE"))!=-1) {
                browserName = "IE";
                //fullVersion = nAgt.substring(verOffset+5);
            }
            // In Chrome, the true version is after "Chrome"
            else if ((verOffset=nAgt.indexOf("Chrome"))!=-1) {
                browserName = "Chrome";
                //fullVersion = nAgt.substring(verOffset+7);
            }
            // In Safari, the true version is after "Safari" or after "Version"
            else if ((verOffset=nAgt.indexOf("Safari"))!=-1) {
                browserName = "Safari";
                //fullVersion = nAgt.substring(verOffset+7);
                //if ((verOffset=nAgt.indexOf("Version"))!=-1)fullVersion = nAgt.substring(verOffset+8);
            }
            // In Firefox, the true version is after "Firefox"
            else if ((verOffset=nAgt.indexOf("Firefox"))!=-1) {
                browserName = "Firefox";
                //fullVersion = nAgt.substring(verOffset + 8);
                // In most other browsers, "name/version" is at the end of userAgent
            }else if ( (nameOffset=nAgt.lastIndexOf(' ')+1) <
                (verOffset=nAgt.lastIndexOf('/')) )
            {
                browserName = nAgt.substring(nameOffset,verOffset);
                //fullVersion = nAgt.substring(verOffset+1);
                if (browserName.toLowerCase()==browserName.toUpperCase()) {
                    browserName = navigator.appName;
                }
            }


            //OS detection
            var OS = "Unknown OS";
            if (navigator.userAgent.indexOf("Win") != -1){OS = "Windows";}
            if (navigator.userAgent.indexOf("Mac") != -1) {OS = "Macintosh";}
            if (navigator.userAgent.indexOf("Linux") != -1){OS = "Linux";}
            if (navigator.userAgent.indexOf("Android") != -1){OS = "Android";}
            if (navigator.userAgent.indexOf("like Mac") != -1) {OS = "iOS";}


            var browser={};
            browser.name=browserName;
            browser.version=fullVersion;
            browser.OS=OS;

            //predicted mimetype
            var mimetype="unsupported/unsupported";
            if(mediatype=='video'){
                switch(browser.name){
                    case 'Edge':
                    case 'MSIE':
                        mimetype="video/webm";
                        break;
                    case 'Safari':
                        mimetype="video/quicktime";
                        //new mobile safari .. but how to detect?
                        //mimetype="video/mp4";
                        break;
                    case 'Firefox':
                    case 'Chrome':
                    case 'Opera':
                    default:
                        mimetype="video/webm";
                }
            }else{
                switch(browser.name){
                    case 'MSIE':
                        mimetype="audio/wav";
                        break;
                    case 'Safari':
                        mimetype="audio/wav";
                        //new mobile safari ... but how do we know?
                        mimetype="audio/mpa";
                        break;
                    case 'Firefox':
                        mimetype="audio/ogg";
                        break;
                    case 'Chrome':
                    case 'Opera':
                    case 'Edge':
                    default:
                        mimetype="audio/webm";
                }
            }
            /*
            document.write(''
                +'Browser name  = '+browser.name+'<br>'
                +'Full version  = '+browser.version+'<br>'
                +'OS  = '+browser.OS+'<br>'
                +'mimetype  = '+mimetype+'<br>'
            )
            */
            return mimetype;
        }//end of guess mimetype
    };//end of returned object (poodllcloud)
});//end of factory method container