// ==UserScript==
// @name         checklinks
// @namespace    hfw.no/ns/checklinks
// @version      0.10
// @description  open all links in page. close them. but if the page reached is a dead link page, leave it open.
// @author       Eirik Hanssen
// @match        http://localhost/~hanson/nibr/completed/*.html
// ==/UserScript==

'use strict';

// Eirik Hanssen, Oslo and Akershus University College of Applied Sciences (2014)


(function checklinks() {
    var url = window.location.href;
    var open_delay_ms = 20;
    var close_delay_ms = 3000;
    var closepage;

    function kill() {
        window.close();
    }

    function closePage() {
        var status = document.querySelector('body').getAttribute('data-status');

        if (status == null) {
            //closepage = window.setTimeout(kill, close_delay_ms);
        } else {
            //window.clearTimeout(closepage);
        }
    }


    function isClientPage(url) {
        if (url.match(/nibr[/]Publikasjoner[/](Notater|Rapporter)/)) {
            return true;
        } else {
            return false;
        }
    }

    function isHostPage(url) {
        if (document.querySelector('body').getAttribute('data-page') == 'host') {
            return true;
        } else {
            return false;
        }
    }

    function init() {
    if (isHostPage()) {
        hostPage();
    } else {
        popupPage();
    }
}
    
    
function popupPage() {
    console.log('popupPage');
}
    

function hostPage() {
        console.log('hostPage');

        function openPages(nodelist, index) {
            //console.log("openPages: ", index);
            var len = nodelist.length;

            if (index < nodelist.length) {
                window.open(nodelist[index].getAttribute('href') + '&index=' + (index + 1));
                var newindex = index + 1;
                window.setTimeout(function() {
                    openPages(nodelist, newindex);
                }, open_delay_ms);
            }

        }

        var publication_link_nodes = document.querySelectorAll('.nibr-publications a');

        openPages(publication_link_nodes, (publication_link_nodes.length - 1));

    } // hostPage()

}()); // function nibr()
