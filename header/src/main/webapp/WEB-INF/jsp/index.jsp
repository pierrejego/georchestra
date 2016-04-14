<%@ page pageEncoding="UTF-8"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>
<%@ page language="java" %>
<%@ page import="java.util.*" %>
<%@ page import="org.georchestra._header.Utf8ResourceBundle" %>
<%@ page import="org.springframework.web.context.support.WebApplicationContextUtils" %>
<%@ page import="org.springframework.context.ApplicationContext" %>
<%@ page import="org.springframework.web.servlet.support.RequestContextUtils" %>
<%@ page import="org.georchestra.commons.configuration.GeorchestraConfiguration" %>

<%@ page contentType="text/html; charset=UTF-8" %>
<%@ page isELIgnored="false" %>
<%
Boolean anonymous = true;

/*
response.setDateHeader("Expires", 31536000);
response.setHeader("Cache-Control", "private, max-age=31536000");
*/

// Using georchestra autoconf
String georLanguage = null;
String georLdapadminPublicContextPath = null;
String ldapadm = null;
try {
  ApplicationContext ctx = RequestContextUtils.getWebApplicationContext(request);
  georLanguage = ctx.getBean(GeorchestraConfiguration.class).getProperty("language");
  georLdapadminPublicContextPath = ctx.getBean(GeorchestraConfiguration.class).getProperty("ldapadminPublicContextPath");
} catch (Exception e) {}

// to prevent problems with proxies, and for now:
response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); // HTTP 1.1
response.setHeader("Pragma", "no-cache"); // HTTP 1.0
response.setDateHeader("Expires", 0); // Proxies.

String active = request.getParameter("active");
if (active == null) {
    active = "none";
}

String lang = request.getParameter("lang");
if (lang == null || (!lang.equals("en") && !lang.equals("es") && !lang.equals("ru") && !lang.equals("fr") && !lang.equals("de"))) {
    if (georLanguage != null)
        lang = georLanguage;
    else
        lang = "fr";
}

if (georLdapadminPublicContextPath != null)
    ldapadm = georLdapadminPublicContextPath;
else
    ldapadm = "/ldapadmin";


Locale l = new Locale(lang);
ResourceBundle resource = org.georchestra._header.Utf8ResourceBundle.getBundle("_header.i18n.index",l);
javax.servlet.jsp.jstl.core.Config.set(
    request,
    javax.servlet.jsp.jstl.core.Config.FMT_LOCALIZATION_CONTEXT,
    new javax.servlet.jsp.jstl.fmt.LocalizationContext(resource)
);

Boolean extractor = false;
Boolean admin = false;
Boolean catadmin = false;
Boolean ldapadmin = false;
Boolean analyticsadmin = false;
Boolean extractorappadmin = false;
String sec_roles = request.getHeader("sec-roles");
if(sec_roles != null) {
    String[] roles = sec_roles.split(";");
    for (int i = 0; i < roles.length; i++) {
        // ROLE_ANONYMOUS is added by the security proxy:
        if (roles[i].equals("ROLE_ANONYMOUS")) {
            //response.setHeader("Cache-Control", "public, max-age=31536000");
            break;
        }
        if (roles[i].equals("ROLE_SV_EDITOR") || roles[i].equals("ROLE_SV_REVIEWER") || roles[i].equals("ROLE_SV_ADMIN") || roles[i].equals("ROLE_ADMINISTRATOR") || roles[i].equals("ROLE_SV_USER")) {
            anonymous = false;
        }
        if (roles[i].equals("ROLE_MOD_EXTRACTORAPP")) {
            extractor = true;
        }
        if (roles[i].equals("ROLE_MOD_LDAPADMIN")) {
            admin = true;
            ldapadmin = true;
        }
        if (roles[i].equals("ROLE_SV_ADMIN")) {
            admin = true;
            catadmin = true;
        }
        if (roles[i].equals("ROLE_ADMINISTRATOR")) {
            admin = true;
            extractorappadmin = true;
        }
        if (roles[i].equals("ROLE_MOD_ANALYTICS")) {
            admin = true;
            analyticsadmin = true;
        }
    }
}

%>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">

<head>

<base target="_parent" />

<style type="text/css">
/* see https://github.com/georchestra/georchestra/issues/147 for missing http protocol 
@font-face {
	font-family: 'montserratbold';
	src: url('montserrat/montserrat-bold-webfont.eot');
	src: url('montserrat/montserrat-bold-webfont.eot?#iefix')
		format('embedded-opentype'),
		url('montserrat/montserrat-bold-webfont.woff2') format('woff2'),
		url('montserrat/montserrat-bold-webfont.woff') format('woff'),
		url('montserrat/montserrat-bold-webfont.ttf') format('truetype'),
		url('montserrat/montserrat-bold-webfont.svg#montserratbold')
		format('svg');
	font-weight: normal;
	font-style: normal;
}

@font-face {
	font-family: 'montserratregular';
	src: url('montserrat/montserrat-regular-webfont.eot');
	src: url('montserrat/montserrat-regular-webfont.eot?#iefix')
		format('embedded-opentype'),
		url('montserrat/montserrat-regular-webfont.woff2') format('woff2'),
		url('montserrat/montserrat-regular-webfont.woff') format('woff'),
		url('montserrat/montserrat-regular-webfont.ttf') format('truetype'),
		url('montserrat/montserrat-regular-webfont.svg#montserratregular')
		format('svg');
	font-weight: normal;
	font-style: normal;
}
*/

@font-face {
	font-family: 'latoregular';
    	src: url('lato/lato-regular-webfont.eot');
    	src: url('lato/lato-regular-webfont.eot?#iefix') format('embedded-opentype'),
		 url('lato/lato-regular-webfont.woff2') format('woff2'),
		 url('lato/lato-regular-webfont.woff') format('woff'),
		 url('lato/lato-regular-webfont.ttf') format('truetype'),
		 url('lato/lato-regular-webfont.svg#latoregular') format('svg');
	    font-weight: normal;
	    font-style: normal;
}




* {
	font-family: 'latoregular', sans-serif;
	font-size: 16px;
	color: white;
}

a {
	color: white;
}

html, body {
	padding: 0;
	margin: 0;
	background: #fff;
}
a, a:hover, li, li:hover {
	cursor: pointer;
}
.main {
	width: 100%;
	height: 40px;
	background-color: #85AA03;
}

.navitem {
	display: inline-block;
	padding: 10px 0 10px 0;
	color: white;
}

.bgicon a {
	background-repeat: no-repeat;
	background-position: 10px 9px;
}

#go_head {
	padding: 0;
	margin: 0;
}

#homelink a {
	background-image: url('img/accueil.png');
}

#catalogue a {
	background-image: url('img/catalogue.png');
}

#map a {
	background-image: url('img/carte.png');
}

#login a {
	background-image: url('img/user.png');
}
#logout a {
	background-image: url('img/logout.png');
}

#go_home img {
	border: none;
}

#go_head ul {
	list-style: none;
	margin: 0;
	padding: 0px;
	display: inline;
}

#go_head li {
	margin: 0;
	padding: 0;
	display: block;
	float: left;
	transition: right .3s ease, left .3s ease, background .3s ease;
	background: transparent;
}
#lefthead {	
	float: left;
	}
#righthead {
	float: right;
}
#go_head li a {
	display: block;
	padding: 10px 20px 10px 40px;
	margin: 0px;
	text-decoration: none;
	transition: background .3s ease-in;
	transition-property: background, color;
	height: 20px;
	width: auto;
}

#go_head li a:hover {
	background-color: #4D4D4D;
	border-bottom: none;
}

#go_head ul li.active a {
	background-color: #4D4D4D;
}

#go_head .logged {
	width: auto;
	float: right;
}

#go_head .logged span {
	color: #000;
}

#go_head .logged span.light {
	color: #ddd;
}

#go_head .logged {
	position: relative;
}

#go_head .logged div {
	
}

#go_head .logged a {;
	
}

#go_head ul ul {
	display: none;
}

#go_head li li {
	right: auto;
}

#go_head .expanded {
	background: white;
	z-index: 1;
	min-width: 20em;
}

#go_head .expanded ul {
	display: block;
}

#go_head .expanded>a, #go_head .expanded ul {
	margin-top: 0;
	float: right;
}

#go_head .expanded>a {
	color: white;
	background: #666;
}

#go_head .group>a:after {
	content: ' »';
}

#go_head .expanded>a:before {
	content: '« ';
}

#go_head .expanded>a:after {
	content: '';
}
/*
@media screen and (max-width: 1370px){
	*{font-size: 14px;}
}
@media screen and (max-width: 1045px){
	*{font-size: 12px;}
		#go_head li a {
			padding: 10px 10px;}
		.bgicon a {
			padding: 13px 15px 10px 25px !important;
			background-position: 3px 9px;
	}
}
*/
</style>

</head>


<body>
	<div class="main">
		<div id="go_head">
			<ul id="lefthead">
			<c:choose>
					<c:when test='<%= active.equals("accueil") %>'>
						<li class="active navitem bgicon" id="homelink">
							<a href="/accueil" id="go_home" title="<fmt:message key='go.home'/>"> 
								<fmt:message key='logo'/>
							</a>
						</li>
					</c:when>
						<c:otherwise>
						<li class="navitem bgicon" id="homelink">
							<a href="/accueil" id="go_home" title="<fmt:message key='go.home'/>"> 
								<fmt:message key='logo'/>
							</a>
						</li>
					</c:otherwise>
				</c:choose>
				<c:choose>
					<c:when test='<%= active.equals("geonetwork") %>'>
						<li class="active navitem bgicon" id="catalogue">
							<a href="/geonetwork/srv/fre/catalog.search#/search?facet.q=topicCat%2Fhealth%26status%2Fcompleted&resultType=details&from=1&to=20&sortBy=relevance&fast=index&_content_type=json"><fmt:message key="catalogue" /></a>
						</li>
					</c:when>
					<c:otherwise>
						<li class="navitem bgicon" id="catalogue">
							<a href="/geonetwork/srv/fre/catalog.search#/search?facet.q=topicCat%2Fhealth%26status%2Fcompleted&resultType=details&from=1&to=20&sortBy=relevance&fast=index&_content_type=json"><fmt:message key="catalogue" /></a>.
						</li>
					</c:otherwise>
				</c:choose>

				<c:choose>
					<c:when test='<%= active.equals("mapfishapp") %>'>
						<li class="active navitem bgicon" id="map"><a><fmt:message key="viewer" /></a></li>
					</c:when>
					<c:otherwise>
						<li class="navitem bgicon" id="map"><a href="/mapfishapp/"><fmt:message key="viewer" /></a></li>
					</c:otherwise>
				</c:choose>

				<c:choose>
					<c:when test='<%= extractor == true %>'>
						<c:choose>
							<c:when test='<%= active.equals("extractorapp") %>'>
								<li class="active navitem" id="services"><a><fmt:message key="extractor" /></a></li>
							</c:when>
							<c:otherwise>
								<li class="navitem" id="services"><a href="/extractorapp/"><fmt:message key="extractor" /></a></li>
							</c:otherwise>
						</c:choose>
					</c:when>
				</c:choose>

				<c:choose>
					<c:when test='<%=admin == true%>'>
						<c:choose>
							<c:when test='<%=active.equals("geoserver")%>'>
								<li class="active navitem" id="geoserver"><a
									href="/geoserver/web/"><fmt:message key="services" /></a></li>
							</c:when>
							<c:otherwise>
								<li class="navitem" id="geoserver"><a
									href="/geoserver/web/"><fmt:message key="services" /></a></li>
							</c:otherwise>
						</c:choose>
					</c:when>
				</c:choose>

				<c:choose>
					<c:when test='<%= ldapadmin == true %>'>
						<c:choose>
							<c:when test='<%= active.equals("ldapadmin") %>'>
								<li class="active navitem"><a><fmt:message key="users" /></a></li>
							</c:when>
							<c:otherwise>
								<li class="navitem"><a href="<%= ldapadm %>/privateui/"><fmt:message key="users" /></a></li>
							</c:otherwise>
						</c:choose>
					</c:when>
				</c:choose>
			</ul>
			
			<ul id="righthead">
			<c:choose>
				<c:when test='<%= anonymous == false %>'>
					<li id="logout" class="logged bgicon">
						<a href="/j_spring_security_logout"><fmt:message key="logout" /></a>
					</li>
					<li id="login" class="logged navitem bgicon">
						<a href="<%=ldapadm %>account/userdetails"><%=request.getHeader("sec-username") %></a>
					</li>
				</c:when>
				<c:otherwise>
					<li id="login" class="logged navitem bgicon">
						<a id="login_a"><fmt:message key="login" /></a>
					</li>
				</c:otherwise>
			</c:choose>
			</ul>
		</div>

		<script>
        (function(){
            // required to get the correct redirect after login, see https://github.com/georchestra/georchestra/issues/170
            var url,
                a = document.getElementById("login_a"),
                cnxblk = document.querySelector('#go_head p.logged');
            if (a !== null) {
                url = parent.window.location.href;
                if (/\/cas\//.test(url) || /\/accueil\//.test(url)) {
                    a.href = "/cas/login";
                } else {
                    // removing any existing anchor from URL first:
                    // see https://github.com/georchestra/georchestra/issues/1032
                    var p = url.split('#', 2),
                    /* Taken from https://github.com/openlayers/openlayers/blob/master/lib/OpenLayers/Util.js#L557 */
                    paramStr = "login", parts = (p[0] + " ").split(/[?&]/);
                    a.href = p[0] + (parts.pop() === " " ?
                        paramStr :
                        parts.length ? "&" + paramStr : "?" + paramStr) +
                        // adding potential anchor
                        (p.length == 2 ? "#" + p[1] : "");
                }
            }

            // handle menus
            if (!window.addEventListener || !document.querySelectorAll) return;
            var each = function(els, callback) {
                for (var i = 0, l=els.length ; i<l ; i++) {
                    callback(els[i]);
                }
            }
            each(document.querySelectorAll('#go_head li a'), function(a){

                a.addEventListener('click', function(e) {
                    each(
                        document.querySelectorAll('#go_head li'),
                        function(l){ l.classList.remove('active');}
                    );
                    a.classList.add('active');
                });
            });
        })();
    </script>
	</div>
</body>
</html>
