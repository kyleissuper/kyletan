/*
 * Things to improve:
 * - AJAX transitions do not update the page title
 * - Animations code could be restructured to be less
 *   repetitive.
 */


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

var popAvail = 1;

function newListeners() {

    // Listen for pop state
    popAvail = 1;
    window.addEventListener("popstate", function(evt) {
        if (popAvail === 1) {
            popAvail = 0;
            // Need to find a better solution for this...
            if ( document.URL === "http://128.199.155.92:8081/" ) {
                AJAX.direction = "-";
            } else {
                AJAX.direction = "+";
            };
            AJAX.request( document.referrer );
        };
    });
    
    // Event listener for home page card links
    Array.prototype.forEach.call( 
            document.getElementsByClassName("card"),
            function cardElement( el ) {
                el.addEventListener(
                    "click",
                    function cardListener( evt ) {
                        evt.preventDefault();
                        this.classList.add( "delayed" );
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
        Velocity(
                document.getElementById("bg-old-0"), 
                { opacity: 0 }, 
                { duration: 350 }
                );

        // Pre-animation

            // Get positions and sizes of old "rise" elements
            AJAX.oldElements.animate_rise.forEach(function(id) {
                var el = document.getElementById(id);
                el.temp_data = {
                    height: el.clientHeight
                            - getComputedStyle(el, null).paddingTop
                            - getComputedStyle(el, null).paddingBottom,
                    width: el.clientWidth
                            - getComputedStyle(el, null).paddingLeft
                            - getComputedStyle(el, null).paddingRight,
                    margins: [
                            getComputedStyle(el, null).marginTop.slice(0, -2) - 0,
                            getComputedStyle(el, null).marginRight.slice(0, -2) - 0,
                            getComputedStyle(el, null).marginBottom.slice(0, -2) - 0,
                            getComputedStyle(el, null).marginLeft.slice(0, -2) - 0
                    ],
                    position: AJAX.get_position( el )
                };
            });
            // Get positions and sizes of old "fade" elements
            AJAX.oldElements.animate_fade.forEach(function(id) {
                var el = document.getElementById(id);
                el.temp_data = {
                    height: el.clientHeight
                            - getComputedStyle(el, null).paddingTop
                            - getComputedStyle(el, null).paddingBottom,
                    width: el.clientWidth
                            - getComputedStyle(el, null).paddingLeft
                            - getComputedStyle(el, null).paddingRight,
                    margins: [
                            getComputedStyle(el, null).marginTop.slice(0, -2) - 0,
                            getComputedStyle(el, null).marginRight.slice(0, -2) - 0,
                            getComputedStyle(el, null).marginBottom.slice(0, -2) - 0,
                            getComputedStyle(el, null).marginLeft.slice(0, -2) - 0
                    ],
                    position: AJAX.get_position( el )
                };
            });
            // Fix body before animation
            var body = document.body;
            body.style.height = body.scrollHeight + "px";
            body.style.overflow = "hidden";
            // Change "animate_delete" to relative
            AJAX.oldElements.animate_delete.forEach(function(id) {
                var el = document.getElementById(id);
                el.style.position = "relative";
                el.style.height = "0px";
                el.style.width = "0px";
                el.style.padding = "0px";
            });
            // Fix old "rise" elements before animation
            AJAX.oldElements.animate_rise.forEach(function(id) {
                var el = document.getElementById(id);
                el.style.position = "absolute";
                el.style.height = el.temp_data.height + "px";
                el.style.width = el.temp_data.width + "px";
                el.style.top = el.temp_data.position.y + "px";
                el.style.left = el.temp_data.position.x + "px";
                el.style.margin = "0px";
            });
            // Fix old "fade" elements before animation
            AJAX.oldElements.animate_fade.forEach(function(id) {
                var el = document.getElementById(id);
                el.style.position = "absolute";
                el.style.height = el.temp_data.height + "px";
                el.style.width = el.temp_data.width + "px";
                el.style.top = el.temp_data.position.y + "px";
                el.style.left = el.temp_data.position.x + "px";
                el.style.margin = "0px";
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

        // Animate!
    
            // Scroll to top
            Velocity(
                    document.getElementsByTagName("body")[0],
                    "scroll",
                    { axis: "y" },
                    { duration: 400 }
                    );
            // Animate out old "rise" elements
            AJAX.oldElements.animate_rise.forEach(function(id) {
                var delay = 0;
                if (document.getElementById(id).classList.contains("delayed")) {
                    delay = 100;
                };
                Velocity(
                    document.getElementById(id),
                    {
                        opacity: 0,
                        top: AJAX.direction + "="+ AJAX.threshold +"px"
                    },
                    {
                        duration: 250 + delay,
                        delay: 125
                    }
                );
            });
            // Animate out old "fade" elements
            AJAX.oldElements.animate_fade.forEach(function(id) {
                var delay = 0;
                if (document.getElementById(id).classList.contains("delayed")) {
                    delay = 100;
                };
                Velocity(
                    document.getElementById(id),
                    {
                        opacity: 0
                    },
                    {
                        duration: 250 + delay,
                        delay: 125
                    }
                );
            });
            // Animate in new "rise" elements
            AJAX.newElements.animate_rise.forEach(function(id) {
                var delay = 0;
                if (document.getElementById(id).classList.contains("delayed")) {
                    delay = 100;
                };
                Velocity(
                    document.getElementById(id),
                    {
                        opacity: 1,
                        marginTop: AJAX.direction + "=" + AJAX.threshold + "px"
                    },
                    {
                        duration: 250,
                        delay: 125 + delay
                    }
                );
            });
            // Animate in new "fade" elements
            AJAX.newElements.animate_fade.forEach(function(id) {
                var delay = 0;
                if (document.getElementById(id).classList.contains("delayed")) {
                    delay = 100;
                };
                Velocity(
                    document.getElementById(id),
                    {
                        opacity: 1
                    },
                    {
                        duration: 250,
                        delay: 125 + delay
                    }
                );
            });

        // After animation
        setTimeout(function() {
            document.getElementsByClassName("old").remove();
            //window.history.replaceState({path: AJAX.url}, '', AJAX.url);
            window.history.pushState({path: AJAX.url}, '', AJAX.url);
            // Important!
            // It's probably not the most elegant way to do this...
            // But it will do for now.
            newListeners();
            document.body.style.height = "";
            document.body.style.overflow = "";
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
            "bg": [],
            "animate_delete": []
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
