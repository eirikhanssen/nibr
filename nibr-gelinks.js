var getPublicationLinks = function () {
    function getTitle (searchNode) {
        if(!searchNode.querySelector('.search_title')) {
            return "";
        } else {
            return searchNode.querySelector('.search_title').textContent;    
        }
        
    }
    function getSeries (searchNode) {
        if(!searchNode.querySelector('.attr_series_title_s')) {
            return "";
        } else {
            return searchNode.querySelector('.attr_series_title_s').textContent;
        }
        
    }
    function determineSeries() {
        var is_rapportSerie = (window.location.href.indexOf('filter=Rapporter') > -1);
        var is_notatSerie = (window.location.href.indexOf('filter=Notater') > -1);
        if (is_rapportSerie) {
            return 'Rapporter';
        } else if (is_notatSerie) {
            return 'Notater';
        }
    }
    function getFilename(url) {
        return url.replace(/^.+?([^/]+)$/,'$1');
    }

    function genDLFilename(series) {
    var pagenum;
    if (!document.querySelector('.pages .current')) {
    pagenum = "0";
    } else {
        pagenum = document.querySelector('.pages .current').textContent;
    }
    return series + "-" + pagenum + ".txt";
}

    function getYearFromSeriesNo(str) {
        if(str == null || str=="") {
            return "no_year";
        } else if (str.match(/\d\d\d\d/)) {
            return str.replace(/^.*?(\d\d\d\d).*$/,'$1');
        } else {
            return "no_year";
        }
    }

    function download(filename, text) {
      var element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
      element.setAttribute('download', filename);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }

    var publication_links = [];

    var base_url = "http://www.hioa.no";

    var series = determineSeries();

    publication_link_node_list = document.querySelectorAll('a.search_line_publication');

    var year = window.location.href.replace(/^.+?filter=(\d\d\d\d).*$/,'$1');
    //console.log(year);
    for (var i = 0; i < publication_link_node_list.length; i++)     {
        var publ = new Object;
        var current = publication_link_node_list[i];
        publ.url = base_url + current.getAttribute('href');
        publ.filename = getFilename(publ.url);
        publ.title = getTitle(current); 
        publ.series_no = getSeries(current);
        publ.series = series;
        //publ.year = year;
        publ.year = getYearFromSeriesNo(publ.series_no);
        publication_links.push(publ);
    }
    //console.log(publication_link_node_list);
    //console.log(publication_links);
    //console.log(series);

    var wget_commands = "";
    for (var j=0; j<publication_links.length; j++) {
        var current_link = publication_links[j];
        wget_commands += "wget -P " + current_link.series + "/" + current_link.year + " " + current_link.url + "\n";
    }

    download(genDLFilename(series), wget_commands);
}

getPublicationLinks();

