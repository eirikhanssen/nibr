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
    //console.log("Start nibr extractor - mine metadata for DOI submission");

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

    function isValidISBN10(isbn_string) {
        var isbn_num_only = isbn_string.toString().replace(/[^0-9]/g, '');
        var calculated_checksum_digit;
        var isbn_base = isbn_num_only.substring(0, 9);
        var supplied_checksum_digit = isbn_num_only.substring(9, 10);
        var isbn_working_string = isbn_base;
        var csumTotal = 0; // The checksum working variable starts at zero

        // if source is less than 9 chars, we make it 9 chars
        if (isbn_base.length < 9) {
            var holdString = '000000000' + isbn_base;
            isbn_base = holdString.substring(holdString.length - 9, holdString.length);
        }



        // Calculate the checksum value for the message

        for (var charPos = 0; charPos <= 8; charPos++) {
            csumTotal = csumTotal + ((charPos + 1) * parseInt(isbn_base.substring(charPos, charPos + 1)));

        }

        // Calculate the checksum digit

        var remainder = csumTotal - parseInt(csumTotal / 11) * 11;
        if (remainder == 0)
            calculated_checksum_digit = '0';
        if (remainder == 10)
            calculated_checksum_digit = 'X';
        else
            calculated_checksum_digit = remainder;

        return calculated_checksum_digit == supplied_checksum_digit;
    }

    function isValidISBN13(isbn_string) {
        var isbn_num_only = isbn_string.toString().replace(/[^0-9]/g, '');
        var calculated_checksum_digit;
        var isbn_base = isbn_num_only.substring(0, 12);
        var supplied_checksum_digit = isbn_num_only.substring(12, 13);

        var isbn_working_string = isbn_base;

        // if source is less than 12 chars, we make it 12 chars
        if (isbn_base.length < 12) {
            var holdString = '000000000000' + isbn_base;
            isbn_base = holdString.substring(holdString.length - 12, holdString.length);
        }
        var csumTotal = 0; // The checksum working variable starts at zero

        // If the source message string is less than 12 characters long, we make it 12 characters

        // Calculate the checksum value for the message

        for (var charPos = isbn_working_string.length - 1; charPos >= 0; charPos--) {
            if (charPos / 2 == parseInt(charPos / 2))
                csumTotal = csumTotal + (parseInt(isbn_working_string.substring(charPos, charPos + 1)));
            else
                csumTotal = csumTotal + (3 * parseInt(isbn_working_string.substring(charPos, charPos + 1)));
        }

        // Calculate the checksum digit

        var remainder = csumTotal - parseInt(csumTotal / 10) * 10;
        if (remainder == 0)
            calculated_checksum_digit = 0;
        else
            calculated_checksum_digit = 10 - remainder;

        return calculated_checksum_digit == supplied_checksum_digit;
    }

    function isValidISBN(str) {
        return (isValidISBN13(str) || isValidISBN10(str));
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
    } else { 
        console.log('unknown page: ' + url); 
    }


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
        //console.log('nibrPublicationPage');
        window.setTimeout(function() { window.close() }, close_delay_ms);
        var metadata = {};

        function getYear() {
            var search = window.location.search.substr(1);
            var year = search.replace(/^.+?year=(\d\d\d\d).+$/, '$1');
            return year;
        }

        function getSeries() {
            var search = window.location.search.substr(1);
            var series = search.replace(/^.*?series=([^\&]+).+$/, '$1');
            return series;
        }

        function getFilename() {
            var search = window.location.search.substr(1);
            var filename = search.replace(/^.*?filename=([^\&]+).*$/, '$1');
            return filename;
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
            if (ingress !== null) {
                return ingress.textContent;
            } else {
                return undefined;
            }

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
            var subtitle = title.replace(/^[^:]+:(.+)$/, '$1').trim();
            return subtitle;
        }

        function getMainTitleFromTitle() {
            var title = document.querySelector('.research_project > h1').textContent.trim();
            var maintitle = title.replace(/^([^:]+):.+$/, '$1').trim();
            return maintitle;
        }

        function hasSubtitle() {
            if (hasSubtitleIngress()) {
                return true;
            } else if (hasSubtitleInTitle()) {
                return true;
            }
            return false;
        }

        function getTitle() {
            var title = document.querySelector('.research_project > h1').textContent.trim();
            if (hasSubtitleIngress()) {
                return title.replace(/'/g,'^');
            } else if (hasSubtitleInTitle()) {
                return getMainTitleFromTitle().replace(/'/g,'^');
            } else {
                return title.replace(/'/g,'^');
            }
        }

        function getSubtitle() {
            if (hasSubtitleIngress()) {
                return getSubtitleFromIngress().replace(/'/g,'^');
            } else if (hasSubtitleInTitle()) {
                return getSubtitleFromTitle().replace(/'/g,'^');
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
                if (possibleMetaEms[j].textContent == 'ISSN:') {
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
                if (possibleMetaEms[j].textContent == 'ISBN:') {
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
                            //console.log(current_author);
                            authors.push(getPersonFromString(current_author));
                        }
                    }
                    return authors;
                }
            }

            //return "Didn't find any authors!";

            //return "didn't find any authors!";
        } // getAuthors()



        function getPublisherItem() {
            var rp_ems = document.querySelectorAll('.research_project > em');
            var pubTypeSegment;
            if (rp_ems != null) {
                pubTypeSegment = rp_ems[1].textContent.trim();
                return pubTypeSegment;
            }
        } //getPublisherItem()

        function getResourceUrl() {
            var urlBase = "http:/\/www.hioa.no/Om-HiOA/Senter-for-velferds-og-arbeidslivsforskning/NIBR/Publikasjoner/Publikasjoner-norsk/";
            var resource = urlBase + getFilename();
            return resource;
        }

        function genDoi(publisheritem, year, series) {
            var doi_base = "10.7577/nibr/";
            series = series.toLowerCase().replace(/^(.+?)er$/, '$1');
            var num = publisheritem.replace(/^.+?:(\d+).*$/, '$1')
            var doi = doi_base + series + "/" + year + "/" + num;
            return doi;
        }

        function getISSNXML(issn) {
            return "<issn>" + issn + "</issn>";
        }

        function isElectronicISBN() {
            var isElectronic = false;
            //determine if the isbn is electronic (if there is a pdf download)
            var download_for_free = document.querySelector('#download_for_free');
            if(download_for_free != null) {
                isElectronic = true;
            }
            return isElectronic;
        }

        function getISBNXML(meta) {
            var isbn_xml_string='<isbn media_type="print"';
            if (!isValidISBN(meta.isbn)) {
                isbn_xml_string += ' control_digit="FAIL"';
            }
            isbn_xml_string += '>' + meta.isbn + '</isbn>';

            if (isElectronicISBN()) {
                isbn_xml_string.replace(/media_type="print"/,'media_type="electronic"');
            }
            return isbn_xml_string;

        }

        function getContributorsXML(authors) {
            var contribXML = "<contributors>";
            var len = authors.length;

            var sequence = ' sequence="first"';

            for (var i = 0; i < authors.length; i++) {
                var author = authors[i];
                if (i > 0) {
                    sequence = ' ';
                }
                var person_name = '<person_name' + sequence + ' contributor_role="author">';
                person_name += '<given_name>' + author.fn + '</given_name>';
                person_name += '<surname>' + author.ln + '</surname>';
                person_name += '</person_name>';
                contribXML += person_name;
            }

            contribXML += "</contributors>";
            return contribXML;
        }

        function getTitlesXML(metadata_obj) {
            var title = metadata_obj.title;
            var subtitle = metadata_obj.subtitle;
            var titles = '<titles><title>' + title + '</title>';
            if (subtitle != "") {
                titles += '<subtitle>' + subtitle + '</subtitle>';
            }
            titles += '</titles>';
            return titles;
        }

        function getReportPaperXML(metadata_obj) {
            var str = '<report-paper><report-paper_series_metadata language="no">';
            str += getSeriesMetaXML(metadata_obj);
            str += metadata_obj.xml.contributors;
            str += metadata_obj.xml.titles;
            str += metadata_obj.xml.publication_date;
            str += metadata_obj.xml.isbn;
            str += metadata_obj.xml.publisher;
            str += metadata_obj.xml.doi_data;
            str += '</report-paper_series_metadata></report-paper>';
            return str;
        }

        function getSeriesMetaXML(metadata_obj) {
            var series_title = "";
            var str = "<series_metadata><titles><title>";
            switch (metadata_obj.series) {
                case 'Rapporter':
                    series_title = 'NIBR Rapport';
                    break;
                case 'Notater':
                    series_title = 'NIBR Notat';
                    break;
            }
            str += series_title + '</title></titles>' + metadata_obj.xml.issn + '</series_metadata>';
            return str;
        }

        function getId() {
            var id = window.location.search.substring(1).replace(/.+?&index=(\d+)/,'$1');
            return id;
        }

        function ajax_post(meta) {
            //console.log("xml: " + meta.xml.reportPaper);
            var statusEl = document.querySelector('#statusEl');
            var xhr = new XMLHttpRequest();
            var post_url = "http://localhost/~hanson/nibr/nibr_xhr.php";
            var post_data = "id=" + meta.id + "&year=" + meta.year + "&series=" + meta.series + "&publisheritem=" + meta.publisheritem + "&filename=" + meta.resource + "&issn=" + meta.issn + "&title=" + meta.title + "&subtitle=" + meta.subtitle + "&isbn=" + meta.isbn + "&isbn_valid=" + meta.isbn_valid + "&xml=" + JSON.stringify(meta.xml.reportPaper);
            xhr.open("POST", post_url, true);
            // set the content type header info for sending url encoded vars in the request
            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            // access the onreadystatechenge event for the XMLHttpRequest object
            xhr.onreadystatechange = function() {

                //console.log(xhr.readyState + ", " + xhr.status);
                var return_data = xhr.responseText;
                if (xhr.readyState == 4 && xhr.status == 200) {
                    statusEl.style.color = "green";
                    statusEl.innerHTML = statusEl.innerHTML + return_data;
                } else {
                    statusEl.style.color = "red";
                    document.querySelector('body').setAttribute('data-status','error');
                    statusEl.innerHTLM = statusEl.innerHTML + return_data;
                }
                closePage();

            };
            xhr.send(post_data);
            statusEl.innerHTML = statusEl.innerHTML + "</br></br><strong>posted data sendt to server: </strong></br></br>" + post_data + "</br>";
        }


        metadata.title = getTitle();
        metadata.subtitle = getSubtitle();
        metadata.year = getYear();
        metadata.authors = getAuthors();
        metadata.issn = getISSN();
        metadata.isbn = getISBN();
        metadata.isbn_valid = isValidISBN(metadata.isbn);
        metadata.publisheritem = getPublisherItem();
        metadata.series = getSeries();
        metadata.resource = getResourceUrl();
        metadata.xml = {};
        metadata.id = getId();
        metadata.doi = genDoi(metadata.publisheritem, metadata.year, metadata.series);
        metadata.xml.doi_data = "<doi_data><doi>" + metadata.doi + "</doi>" + "<resource>" + metadata.resource + "</resource></doi_data>";
        metadata.xml.publisher = '<publisher><publisher_name>By- og regionforskningsinstituttet NIBR</publisher_name><publisher_place>Oslo</publisher_place></publisher>';
        metadata.xml.publication_date = '<publication_date media_type="print"><year>' + metadata.year + '</year></publication_date>';
        metadata.xml.issn = getISSNXML(metadata.issn);
        metadata.xml.isbn = getISBNXML(metadata);
        metadata.xml.contributors = getContributorsXML(metadata.authors);
        metadata.xml.titles = getTitlesXML(metadata);
        metadata.xml.reportPaper = getReportPaperXML(metadata);
        //console.log(metadata);




        // send the data to php now and wait for response to update the status div.

        var statusEl = document.createElement("aside");
        statusEl.id = "statusEl";
        statusEl.innerHTML = "processing XHR...</br>";
        statusEl.style.cssText = "position:fixed; top:0; right:0; bottom:0; width: 98%; margin-top: 3em; margin-bottom: 3em; margin-right: auto; margin-left: auto; opacity: 0.9; border: 3px solid red; color: black; background-color: #dddddd; font-family: sans-serif; padding: 0.5em; font-size: 1.1em; box-shadow: 0 0 5px black;";
        document.querySelector("body").appendChild(statusEl);
        statusEl.addEventListener('click', function(event) {
            event.target.parentNode.removeChild(event.target);
        }, false);

        console.log("posting: ");
        //console.log(stringified);
        ajax_post(metadata);
    }


    /*
        ==========================================
         SCENARIO B:
         The host page.
         - Just open all the pages in the list.
        ==========================================
    */
    function nibrHostPage() {
        //console.log('nibrHostPage');

        function openPages(nodelist, index) {
            //console.log("openPages: ", index);
            var len = nodelist.length;

            if (index < nodelist.length) {
                window.open(nodelist[index].getAttribute('href') + '&index=' + (index+1));
                var newindex = index + 1;
                window.setTimeout(function() {
                    openPages(nodelist, newindex);
                }, open_delay_ms);
            }

        }

        var publication_link_nodes = document.querySelectorAll('.nibr-publications a');

        openPages(publication_link_nodes,0);

    } // nibrHostPage()

}()); // function nibr()
