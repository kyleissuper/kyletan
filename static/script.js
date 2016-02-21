// For removing elements
Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
}
NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
    for(var i = this.length - 1; i >= 0; i--) {
        if(this[i] && this[i].parentElement) {
            this[i].parentElement.removeChild(this[i]);
        }
    }
}

function newListeners() {

    // Event listener for pop state
    window.addEventListener("popstate", function() {
        AJAX.direction = AJAX.direction === "+" ? "-" : "+";
        AJAX.request( document.referrer );
    });
    
    // Event listener for home page card links
    Array.prototype.forEach.call( 
            document.getElementsByClassName("card"),
            function cardElement( el ) {
                el.addEventListener(
                    "click",
                    function cardListener( evt ) {
                        evt.preventDefault();
                        AJAX.direction = "+";
                        AJAX.request( this.href );
                    });
            }
        );
    
    // Event listener for back link
    Array.prototype.forEach.call( 
            document.getElementsByClassName("back"),
            function cardElement( el ) {
                el.addEventListener(
                    "click",
                    function cardListener( evt ) {
                        evt.preventDefault();
                        AJAX.direction = "-";
                        AJAX.request( this.href );
                    });
            }
        );

};

newListeners();

// Error messages
function raiseError( url, error ) {
    alert( url, error );
    //window.location.href = url;
};

// Pretty, gracefully degrading page transitions
var AJAX = {
    threshold: 50,
    response: {},
    animateQ: [],
    renameOld: function renameOld() {
        Object.keys(AJAX.oldElements).forEach(function loopThroughClasses(c) {
            var i = 0;
            Array.prototype.forEach.call(
                document.getElementsByClassName(c),
                function renameElement(el) {
                    el.classList.add("old");
                    el.id = c + "-old-" + i;
                    AJAX.oldElements[c].push(c + "-old-" + i);
                    i++;
                }
            );
        });
    },
    loadNew: function loadNew() {
        var body = document.getElementsByTagName("body")[0];
        body.innerHTML += AJAX.html;
        // Name new elements
        Object.keys(AJAX.newElements).forEach(function loopThroughClasses(c) {
            var i = 0;
            Array.prototype.forEach.call(
                document.getElementsByClassName(c),
                function renameElement(el) {
                    if (!el.classList.contains("old")) {
                        el.id = c + "-new-" + i;
                        AJAX.newElements[c].push(c + "-new-" + i);
                        i++;
                    };
                }
            );
        });
        // Wait for new BG to load, then callback --> animate
        var image = document.createElement('img');
        image.src = document.getElementsByClassName('bg')[1].style.backgroundImage.replace(/url\(['"]?(.*?)['"]?\)/i, "$1");
        image.onload = AJAX.animate();
    },
    get_position: function getPosition(element) {
        // From https://www.kirupa.com/html5/get_element_position_using_javascript.htm
        var xPosition = 0;
        var yPosition = 0;
        while(element) {
            xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
            yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
            element = element.offsetParent;
        }
        return { x: xPosition, y: yPosition };
    },
    animate: function animate() {
        // Fade out old background
        Velocity(document.getElementById("bg-old-0"), { opacity: 0 }, { duration: 350 });
        // Get positions and sizes of old "rise" elements
        AJAX.oldElements.animate_rise.forEach(function(id) {
            var el = document.getElementById(id);
            el.temp_data = {
                height: el.clientHeight,
                width: el.clientWidth - 40, // This should be minus paddingLeft and paddingRight. Not sure why it's not working for me.
                position: AJAX.get_position( el )
            };
        });
        // Get positions and sizes of old "fade" elements
        AJAX.oldElements.animate_fade.forEach(function(id) {
            var el = document.getElementById(id);
            el.temp_data = {
                height: el.offsetHeight,
                width: el.offsetWidth,
                position: AJAX.get_position( el )
            };
        });
        // Fix old "rise" elements before animation
        AJAX.oldElements.animate_rise.forEach(function(id) {
            var el = document.getElementById(id);
            el.style.position = "absolute";
            el.style.height = el.temp_data.height + "px";
            el.style.width = el.temp_data.width + "px";
            el.style.top = el.temp_data.position.y + "px";
            el.style.left = el.temp_data.position.x + "px";
        });
        // Fix old "fade" elements before animation
        AJAX.oldElements.animate_fade.forEach(function(id) {
            var el = document.getElementById(id);
            el.style.position = "absolute";
            el.style.height = el.temp_data.height + "px";
            el.style.width = el.temp_data.width + "px";
            el.style.top = el.temp_data.position.y + "px";
            el.style.left = el.temp_data.position.x + "px";
        });
        // New "rise" elements!
        AJAX.newElements.animate_rise.forEach(function(id) {
            var el = document.getElementById(id),
                direction = "+" === AJAX.direction ? 1 : -1;
            el.style.opacity = 0;
            el.style.marginTop = el.style.marginTop - ( AJAX.threshold * direction ) + "px";
        });
        // New "fade" elements!
        AJAX.newElements.animate_fade.forEach(function(id) {
            var el = document.getElementById(id);
            el.style.opacity = 0;
        });
        // Animate out old "rise" elements
        AJAX.oldElements.animate_rise.forEach(function(id) {
            Velocity(
                document.getElementById(id),
                {
                    opacity: 0,
                    top: AJAX.direction + "="+ AJAX.threshold +"px"
                },
                {
                    duration: 250,
                    delay: 125
                }
            );
        });
        // Animate out old "fade" elements
        AJAX.oldElements.animate_fade.forEach(function(id) {
            Velocity(
                document.getElementById(id),
                {
                    opacity: 0
                },
                {
                    duration: 250,
                    delay: 125
                }
            );
        });
        // Animate in new "rise" elements
        AJAX.newElements.animate_rise.forEach(function(id) {
            Velocity(
                document.getElementById(id),
                {
                    opacity: 1,
                    marginTop: AJAX.direction + "=" + AJAX.threshold + "px"
                },
                {
                    duration: 250,
                    delay: 125
                }
            );
        });
        // Animate in new "fade" elements
        AJAX.newElements.animate_fade.forEach(function(id) {
            Velocity(
                document.getElementById(id),
                {
                    opacity: 1
                },
                {
                    duration: 250,
                    delay: 125
                }
            );
        });
        // Remove old elements
        setTimeout(function() {
            document.getElementsByClassName("old").remove();
            window.history.pushState({path: AJAX.url}, '', AJAX.url);
            // Important!
            newListeners();
        }, 600);
    },
    callback: function callback() {

        if ( AJAX.response.httpStatus !== 200 ) {
            raiseError(AJAX.url, "Connection error. Please re-try.");
        } else {
            AJAX.renameOld();
            AJAX.loadNew();
        };

    },
    requestChanged: function requestChanged() {

        if ( this.readyState === 4 ) {

            if (this.status == 200) {
                AJAX.response.httpStatus = 200;
                AJAX.response.content = this.responseText;
                AJAX.html = AJAX.response.content.split("<body>")[1];
                AJAX.html = AJAX.html.split("</body>")[0];
            } else {
                AJAX.response.httpStatus = this.status;
            };

            AJAX.callback();

        };

    },
    request: function request( url ) {

        this.httpRequest = "";
        this.httpRequest = new XMLHttpRequest();
        this.url = url;
        this.response = {
            httpStatus: "",
            content: ""
        };
        this.oldElements = {
            "back": [],
            "animate_fade": [],
            "animate_rise": [],
            "bg": []
        },
        this.newElements = {
            "back": [],
            "animate_fade": [],
            "animate_rise": [],
        };

        if (!this.httpRequest) {
            this.response.httpStatus = "No AJAX";
            return;
        };

        this.httpRequest.onreadystatechange = this.requestChanged;
        this.httpRequest.open('GET', url, true);
        this.httpRequest.send();

    }
};
