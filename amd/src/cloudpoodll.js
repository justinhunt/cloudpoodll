
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
        version: '1.0.0',
        //baseURL: 'http://localhost/moodle/filter/poodll/ext/poodllrecorder.php',
        baseURL: 'https://cloud.poodll.com/filter/poodll/ext/poodllrecorder.php',
        params: ['parent','timelimit','type','media','updatecontrol','width','height','id'],

        fetchContainers: function(classname){
            var divs = document.getElementsByClassName(classname);
            return divs;
        },
        autoCreateRecorders: function(classname){
            if(!classname){classname='poodllrecorder';}
            var containers = this.fetchContainers(classname);
            for(var ctr=0;ctr<containers.length;ctr++){
                this.insertRecorder(containers[ctr]);
            }
        },
        createRecorder: function(elementid){
            var theelement=document.getElementById(elementid);
            this.insertRecorder(theelement);
        },

        insertRecorder: function(container){
            var attributes = this.parseAttributes(container);
            var iframe = this.createIframe(attributes);
            container.appendChild(iframe);
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
            var iframe = document.createElement('iframe');
            var iframeurl = this.baseURL + '?';
            for (var property in attributes) {
                iframeurl = iframeurl + property + '=' + attributes[property] + '&';
            }
            iframe.setAttribute('src', iframeurl);
            iframe.setAttribute('width', attributes.width);
            iframe.setAttribute('height', attributes.height);
            iframe.setAttribute('frameBorder', 0);
            iframe.setAttribute('allow', 'camera,microphone');
            return iframe;
        },
        theCallback: function(data) {
            if(data.type =='filesubmitted'){
                var inputControl = data.updatecontrol;
                var pokeInput = document.getElementById(inputControl);
                var shortUrl = data.cloudroot + data.cloudfilename;
                //var filename = data.cloudfilename;
                if (pokeInput) {
                    pokeInput.value = shortUrl;
                }
            }
        },
        initEvents: function(){
            var that = this;
            window.onmessage = function(e) {
                var data = e.data;
                if (data && data.hasOwnProperty('id') && data.hasOwnProperty('type')){
                    that.theCallback(data);
                }
            };
        },
        fetchroot: function(){
            return root;
        }
    };//end of returned object (poodllcloud)
});//end of factory method container