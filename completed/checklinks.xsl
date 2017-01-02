<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:xs="http://www.w3.org/2001/XMLSchema"
	xmlns:xr="http://www.crossref.org/schema/4.3.7"
	exclude-result-prefixes="xs xr"
	version="2.0">
<xsl:output method="html" indent="yes" omit-xml-declaration="yes"></xsl:output>
	<xsl:template match="/">
	<body data-page="host">
<ol>
		<xsl:apply-templates select="//xr:resource"/>
</ol>
	</body>
</xsl:template>

<xsl:template match="xr:resource">
	<xsl:variable name="link_id_comment" select="ancestor::xr:report-paper_series_metadata/preceding-sibling::comment()[1]"/>
<xsl:variable name="link_id" select="replace($link_id_comment, '^.+?(\d+).*?$','$1')"/>
<li><a data-link-id="{$link_id}" href="{.}"><xsl:value-of select="."/></a></li>
</xsl:template>
</xsl:stylesheet>