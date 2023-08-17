window.addEventListener('DOMContentLoaded', (function() {
    var contents;
	var protocol;
    var hostname;
    var directory;
    var file;
    
    function parseBase() {
        var slashPos;
        var pos;
        var remainder;

        pos = BASE.indexOf('://');
        protocol = BASE.substr(0, pos);
        remainder = BASE.substr(pos + 3);
        slashPos = remainder.indexOf('/');

        if (slashPos === -1) {
            hostname = remainder;
            directory = "";
            file = "";
        } else {
            hostname = remainder.substr(0, slashPos);
            remainder = remainder.substr(slashPos + 1);
            slashPos = remainder.lastIndexOf('/');

            if (slashPos === -1) {
                directory = "";
                file = remainder;
            } else {
                directory = remainder.substr(0, slashPos);
                file = remainder.substr(slashPos + 1);
            }
        }

        console.log("protocol: ", protocol);
        console.log("hostname: ", hostname);
        console.log("file: ", file);
    }

    function relativeToAbsolute(url) {
        if (url.indexOf('://') > -1) {
            return url;
        } else if (url[0] === '/') {
            return protocol + "://" + hostname + url;
        } else {
            if (directory === "") {
                return protocol + "://" + hostname + "/" + url;
            } else {
                return protocol + "://" + hostname + "/" + directory + "/" + url;
            }
        }
    }

    function parsePage() {
        var parser = new DOMParser();
        contents = parser.parseFromString(atob(PAGE), "text/html");
        console.log(contents);
    }

    function moveChildren(source, destination) {
    while (source.childNodes.length > 0) {
        var child = source.childNodes[0];
        source.removeChild(child);
        
        if (child.tagName === 'SCRIPT') {
            var node = document.createElement('script');
            
            if (child.getAttribute('src')) {
                node.setAttribute('src', child.getAttribute('src'));
            } else {
                node.setAttribute('src', 'data:text/javascript;base64,' + btoa(child.innerText));
                }
            
            destination.appendChild(node);
        } else {
            destination.appendChild(child);
        }
    }
}


    function fixTags(tagName, attribute) {
        var tags = contents.getElementsByTagName(tagName);

        for (var counter = 0; counter < tags.length; counter++) {
            var url = tags[counter].getAttribute(attribute);
            if (url) {
                tags[counter].setAttribute(attribute, relativeToAbsolute(url));
            }
        }
    }

    function fixRedirectedTags(tagName, attribute) {
        var tags = contents.getElementsByTagName(tagName);

        for (var counter = 0; counter < tags.length; counter++) {
            var url = tags[counter].getAttribute(attribute);
            if (url) {
                tags[counter].setAttribute(attribute, relativeToAbsolute(url));
            }
        }
    }

    function fixURLs() {
        fixTags('img', 'src');
        fixTags('script', 'src');
        fixTags('link', 'href');
        fixRedirectedTags('a', 'href');
    }
	
	function buildTOC() {
    var levels = [0];
    var headers = [];
    var html = "";
	
	function addListItem(node) {
		var child = document.createElement('li');
		child.innerText = node.innerText;
	    headers[headers.length - 1].appendChild(child);
	}
	
	function addLevel(node, level) {
		var child = document.createElement('ul')
		headers.push(child);
	    addListItem(node);
        levels.push(level);
	}
	
	function removeLevel() {
		headers.pop()
        levels.pop();
	}

    function checkNode(node) {
        if (node.nodeType !== document.ELEMENT_NODE) {
            return;
        }

        if (node.tagName[0] === 'H' && node.tagName[1] >= '1' && node.tagName[1] <= '6') {
            var level = Number(node.tagName[1]);
            var currentLevel = levels[levels.length - 1];

            if (level > currentLevel) {
                addLevel(node, level);
				
            } else if (level === currentLevel) {
                html += "<li>" + node.innerText + "</li>\n";
				addListItem(node);
            } else if (level < currentLevel) {
                while (level < currentLevel) {
                    removeLevel();
                    currentLevel = levels[levels.length - 1];
                }
				checkNode(node);
            }

            console.log(node.tagName, node.innerText);
        }

        for (var counter = 0; counter < node.childNodes.length; counter++) {
            checkNode(node.childNodes[counter]);
        }
    }

    checkNode(contents.body);
	document.getElementById('toc').appendChild(headers[0]);
	}

	

    function moveContent() {
        moveChildren(contents.head, document.head);
        moveChildren(contents.body, document.getElementById('contents'));
    }

    function submit() {
    console.log("submitted:", encodeURIComponent(document.getElementById('urlBox').value));
    window.location.href = window.location.origin + window.location.pathname + "?url=" + encodeURIComponent(document.getElementById('urlBox').value);
}


    function addEventListener() {
        document.getElementById('goButton').addEventListener('click', submit);
        document.getElementById('urlBox').addEventListener('keydown', function(event) {
            if (event.keyCode == 13 || event.keyCode == 10) {
                submit();
            }
        });
    }

    return function() {
        parseBase();
        parsePage();
        fixURLs();
		buildTOC();
        moveContent();
        addEventListener();
    };
})());

