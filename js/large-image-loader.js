// For more check out zachsaucier.com

var count = 0;

// Detect SMIL animation ability
var detector = document.createElementNS("http://www.w3.org/2000/svg", "animate"),
    supportsSMIL = detector.beginElement ? true : false;

function resetCircleAnim(elem) {
    /* Force the animations to restart */
    elem.setAttribute("repeatCount", 1);
    elem.nextElementSibling.setAttribute("repeatCount", 1);
    if(elem.getAttribute("data-pb-SVGID"))
        document.getElementById(elem.getAttribute("data-pb-SVGID")).pauseAnimations(); 
}

var imgElems = document.querySelectorAll(".pb"), // The elements that are the to be used for the image
    urlCreator = window.URL || window.webkitURL; // For URL creator usage later
    
// Add the image loading effect for each element
[].forEach.call(imgElems, loadImage); 

// Show the effect again on click (DEMO USES ONLY)
[].forEach.call(imgElems, function (elem) {
    elem.addEventListener("click", function () {
        if(elem.className.indexOf("complete") > -1) {
            // Reset the element
            elem.className = "pb"; 
            elem.style.backgroundImage = "none";
            elem.removeChild(elem.querySelector("svg"));
            
            // If it's the circle, reset it
            if(elem.getAttribute("data-pb-type") === "ring") {
                if(elem.hasAttribute("data-pb-svgid")) {
                    var circleSVG = document.getElementById(elem.getAttribute("data-pb-SVGID")); 
                    resetCircleAnim(circleSVG.querySelector("animate"));
                }
            } 
            
            // Do the effect again
            loadImage(elem);
        }  
    });
});

// Load the image in the way specified by the data attribute
function loadImage(elem) {
    // Determine which loader to create
    var progressBarElem = getProgressBarElem(),
        imgLoc = elem.getAttribute("data-pb-src");

    // Load the image via XHR so that we can track the progress    
    var req = new XMLHttpRequest();
    // Attach the finished load listener
    req.onload = loadFinished.bind(null, elem);
    // Attach the progress listener
    req.onprogress = loading.bind(); // this makes no sense. RL
    // Actually make the request
    req.open('GET', imgLoc + '?' + Math.random(), true); // THE ` + '?' + Math.random()` PART IS FOR TESTING. REMOVE IT IN PRODUCTION
    req.responseType = 'blob'; // This must be after the open - FF can't handle do it before https://bugzilla.mozilla.org/show_bug.cgi?id=1110761
    req.send();

    // Determine which progress bar to use given the data attribute and return it
    function getProgressBarElem() {
        var type = elem.getAttribute("data-pb-type");
        
        // Choose the progress bar type based on the pb-type
        if (type === "line-top" || 
            type === "line-flat-top" || 
            type === "fill-left" ||
            type === "diagonal") { 
            var line = new ProgressBar.Line(elem);
            
            // Fix an IE issue
            if(type === "line-top") 
                line.svg.setAttribute("preserveAspectRatio", "xMinYMin");
            else if(type === "diagonal")
                line.svg.setAttribute("preserveAspectRatio", "xMinYMid");
            
            return line;
        } else if(type === "square") {
            return new ProgressBar.Square(elem, {
                strokeWidth: 10
            });
        } else if(type === "svg") {
            var svgPath = document.getElementById(elem.getAttribute("data-pb-svg"));
            return new ProgressBar.Path(svgPath, {
                stokeWidth: 5
            });
        } else if(type === "ring"
               && window.getComputedStyle(elem, null).getPropertyValue("-webkit-clip-path") === "") {

            var IDNum = getCircleSVGID();
            elem.setAttribute("data-pb-svgid", "circleSVG" + IDNum);
            elem.style.clipPath = "url(#clipPath" + IDNum + ")";
        } else if (type !== "ring" && type !== "corner-ring") 
            console.log("The given type ", type, " is not valid. Using a circle instead.");

        if(!supportsSMIL) 
            elem.className += " noSMIL";
        
        var ring = new ProgressBar.Circle(elem, {
            strokeWidth: 10
        });
        // Fix another IE issue
        ring.svg.setAttribute("preserveAspectRatio", "xMidYMid");
        ring.svg.querySelector("path").setAttribute("preserveAspectRatio", "xMidYMid");
        return ring;
    }

    // Update the progress bar with the current value
    var toggle = true; // this is a terrible name ;) RL
    function loading(evt) {
        if (evt.lengthComputable) {
            progressBarElem.animate(evt.loaded / evt.total);
            // Force sublte background change to fix an IE rendering issue
            document.body.style.backgroundColor = toggle ? '#F7F6E2' : '#F7F5E2';
            toggle = !toggle;
        }
    }

    // Remove the loader when it's done and show the image
    function loadFinished(elem) {
        // Create a URL for the given response
        var imgUrl = urlCreator.createObjectURL(req.response);
        // Set that URL as the background of the element given
        elem.style.backgroundImage = 'url(' + imgUrl + ')';
        
        // Finish the animation
        progressBarElem.animate(1, function () {
            // If it needs to use an SVG animation, use it
            if(elem.getAttribute("data-pb-type") === "ring") {
                // IE doesn't support SMIL at all, so prevent these lines from running in it
                if(supportsSMIL && elem.hasAttribute("data-pb-svgid")) {
                    var circleSVG = document.getElementById(elem.getAttribute("data-pb-svgid"));
                    circleSVG.querySelector("animate").beginElement();
                    circleSVG.querySelectorAll("animate")[1].beginElement();
                    circleSVG.unpauseAnimations(); 
                }
            } 
            
            // Add the "complete" class to show it's done 
            elem.classList.add("complete");
        });
    }
}

function getCircleSVGID() {
    // Create the SVG element and set its attributes
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttributeNS(null,'width', '0');
    svg.setAttributeNS(null,'height', '0');
    svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
    svg.setAttributeNS(null,"id", "circleSVG" + count);

    // Create the inner elements and give them the proper attributes
    var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

    var clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    clipPath.setAttribute("clipPathUnits", "objectBoundingBox");
    clipPath.setAttribute("id", "clipPath" + count);
    
    var ellipse = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    ellipse.setAttribute("cx", "0.5");
    ellipse.setAttribute("cy", "0.5");

    var anim1 = document.createElementNS("http://www.w3.org/2000/svg", "animate");
    anim1.setAttribute("attributeName" , "rx");
    anim1.setAttribute("begin" , "indefinite");
    anim1.setAttribute("from" , "0.074");
    anim1.setAttribute("to" , "1.5");
    anim1.setAttribute("dur" , "1.5s");
    anim1.setAttribute("fill" , "freeze");

    var anim2 = document.createElementNS("http://www.w3.org/2000/svg", "animate");
    anim2.setAttribute("attributeName" , "ry");
    anim2.setAttribute("begin" , "indefinite");
    anim2.setAttribute("from" , "0.111");
    anim2.setAttribute("to" , "2.25");
    anim2.setAttribute("dur" , "1.5s");
    anim2.setAttribute("fill" , "freeze");

    // Append the elements to their respectful parents
    ellipse.appendChild(anim1);
    ellipse.appendChild(anim2);

    clipPath.appendChild(ellipse);

    defs.appendChild(clipPath);

    svg.appendChild(defs);

    // Pause the animations so we can see them later
    svg.pauseAnimations();

    document.body.appendChild(svg);

    // Return the number in the ID for reference
    return count++;
}