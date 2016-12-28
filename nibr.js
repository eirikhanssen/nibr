// ==UserScript==
// @name         nibr extractor
// @namespace    hfw.no/ns/nibr
// @version      0.50
// @description  Extract info from nibr publications
// @author       Eirik Hanssen
// @match        http://localhost/~hanson/nibr/Publikasjoner/nibr.html
// @match        http://localhost/~hanson/nibr/Publikasjoner/Rapporter/*
// @match        http://localhost/~hanson/nibr/Publikasjoner/Notater/*
// ==/UserScript==

'use strict';

// Eirik Hanssen, Oslo and Akershus University College of Applied Sciences (2014)


// kjører på en side som åpner publikasjonssider
// kjører på publikasjonssider og henter ut metadata

(function nibr() {
    var url = window.location.href;
    var open_delay_ms = 100;
    var close_delay_ms = 100000;
    console.log("Start nibr extractor - mine metadata for DOI submission");

    /*
        ==========================================
         Functions needed in all scenarios
        ==========================================
    */

    function isNibrPublicationPage(url) {
        if (url.match(/nibr[/]Publikasjoner[/](Notater|Rapporter)/)) {
            return true;
        } else {
            return false;
        }
    }

    function isNibrLenkesamling(url) {
        if (document.querySelector('head title').textContent.indexOf('nibr lenkesamling') > -1) {
            return true;
        } else {
            return false;
        }
    }


    /*
        ==========================================
         Determine which scenario to run
        ==========================================
    */

    if (isNibrPublicationPage(url)) {
        nibrPublicationPage();
    } else if (isNibrLenkesamling(url)) {
        nibrHostPage();
    } else { console.log('unknown page: ' + url); }


    /*
        ==========================================
         SCENARIO A:
         Script is running on a popupage that should be mined for data
         - mine data
         - send to server
         - close page
        ==========================================
    */
    function nibrPublicationPage() {
        console.log('nibrPublicationPage');
        window.setTimeout(function() { window.close() }, close_delay_ms);
        var metadata = {};

        function getYear() {
            var search = window.location.search.substr(1);
            var year = search.replace(/^.+?year=(\d\d\d\d).+$/, '$1');
            return year;
        }

        function hasSubtitleIngress() {
        var ingress = document.querySelector('.ingress');
        if (ingress !== null) {
            return true;
        } else {
            return false;
        }
    }
    function getSubtitleFromIngress() {
        var ingress = document.querySelector('.ingress');
        if(ingress !== null) {
            return ingress.textContent;
        } else {return undefined;}
        
    }
    function hasSubtitleInTitle() {
        var title = document.querySelector('.research_project > h1').textContent;
        if (title.match(/[:]/) === null) {
            return false;
        } else {
            return true;    
        }
    }
    function getSubtitleFromTitle() {
        var title = document.querySelector('.research_project > h1').textContent.trim();
        var subtitle = title.replace(/^[^:]+:(.+)$/,'$1').trim();
        return subtitle;
    }
    function getMainTitleFromTitle() {
        var title = document.querySelector('.research_project > h1').textContent.trim();
        var maintitle = title.replace(/^([^:]+):.+$/,'$1').trim();
        return maintitle;
    }

    function hasSubtitle() {
        if(hasSubtitleIngress()){
            return true;
        } else if (hasSubtitleInTitle()) {
            return true;
        }
        return false;
    }
    
    function getTitle() {
        var title = document.querySelector('.research_project > h1').textContent.trim();
        if(hasSubtitleIngress()) {
            return title;
        } else if(hasSubtitleInTitle()) {
            return getMainTitleFromTitle();
        } else {
            return title;
        }
    }

    function getSubtitle() {
        if(hasSubtitleIngress()) {
            return getSubtitleFromIngress();
        } else if(hasSubtitleInTitle()) {
            return getSubtitleFromTitle();
        } else {
            return "";
        }
    }

    function getMetaEms() {
        return document.querySelectorAll('div.publication_right_content_line > em');
    }

    function getISSN() {
        var ISSN = "";
        var possibleMetaEms = getMetaEms();
        for (var j = 0; j < possibleMetaEms.length; j++) {
            if(possibleMetaEms[j].textContent == 'ISSN:') {
                ISSN = possibleMetaEms[j].nextElementSibling.textContent.trim();
                return ISSN;
            }
        }
        return ISSN;
    }

    function getISBN() {
        var ISBN = "";
        var possibleMetaEms = getMetaEms();
        for (var j = 0; j < possibleMetaEms.length; j++) {
            if(possibleMetaEms[j].textContent == 'ISBN:') {
                ISBN = possibleMetaEms[j].nextElementSibling.textContent.trim();
                return ISBN;
            }
        }
        return ISBN;
    }

    function getAuthors() {

        function getPersonFromString(str) {
            // check if the name is reversed
            var isReversed = (str.match(",") !== null);
            var splitter = " ";
            var parts, first, last;

            if (!isReversed) {
                parts = str.split(splitter);
                var len = parts.length;
                var last = parts[len - 1];
                var first = "";
                for (var i = 0; i < len - 1; i++) {
                    if (i > 0) { first = first + " "; }
                    first = first + parts[i];
                }
            } else {
                splitter = ",";
                parts = str.split(splitter);
                last = parts[0];
                first = parts[1];
            }
            return { fn: first.trim(), ln: last.trim() };
        }


        var ems = document.querySelectorAll('em');
        var current_em;
        var authorLIs;
        var authors = [];
        var current_author = "";
        var i;
        for (i = 0; i < ems.length; i++) {
            current_em = ems[i];
            //console.log(current_em.innerText);
            if (current_em.innerText == "Forfatter(e):") {
                authorLIs = current_em.nextElementSibling.querySelectorAll('li');
                //return authorLIs;

                for (i = 0; i < authorLIs.length; i++) {
                    current_author = authorLIs[i].textContent.trim();
                    if (current_author !== "") {
                        console.log(current_author);
                        authors.push(getPersonFromString(current_author));
                    }
                }
                return authors;
            }
        }

        //return "Didn't find any authors!";

        //return "didn't find any authors!";
    } // getAuthors()
        metadata.title = getTitle();
        metadata.subtitle = getSubtitle();
        metadata.year = getYear();
        metadata.authors = getAuthors();
        metadata.issn = getISSN();
        metadata.isbn = getISBN();
        console.log(metadata);
    }


    /*
        ==========================================
         SCENARIO B:
         The host page.
         - Just open all the pages in the list.
        ==========================================
    */
    function nibrHostPage() {
        console.log('nibrHostPage');

        var open_delay_ms = 100000;

        function openPages(nodelist, index) {
            console.log("openPages: ", index);
            var len = nodelist.length;

            if (index < nodelist.length) {
                window.open(nodelist[index].getAttribute('href'));
                var newindex = index + 1;
                window.setTimeout(function() {
                    openPages(nodelist, newindex);
                }, open_delay_ms);
            }

        }

        var publication_link_nodes = document.querySelectorAll('.nibr-publications a');

        openPages(publication_link_nodes, publication_link_nodes.length - 1);

    } // nibrHostPage()

}()); // function nibr()
