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
        lang = "en";
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

    <style type="text/css">
        /* see https://github.com/georchestra/georchestra/issues/147 for missing http protocol */

		 @font-face {
		    font-family: 'montserratbold';
		    src: url('montserrat/montserrat-bold-webfont.eot');
		    src: url('montserrat/montserrat-bold-webfont.eot?#iefix') format('embedded-opentype'),
		         url('montserrat/montserrat-bold-webfont.woff2') format('woff2'),
		         url('montserrat/montserrat-bold-webfont.woff') format('woff'),
		         url('montserrat/montserrat-bold-webfont.ttf') format('truetype'),
		         url('montserrat/montserrat-bold-webfont.svg#montserratbold') format('svg');
		    font-weight: normal;
		    font-style: normal;
		
		}
		@font-face {
		    font-family: 'montserratregular';
		    src: url('montserrat/montserrat-regular-webfont.eot');
		    src: url('montserrat/montserrat-regular-webfont.eot?#iefix') format('embedded-opentype'),
		         url('montserrat/montserrat-regular-webfont.woff2') format('woff2'),
		         url('montserrat/montserrat-regular-webfont.woff') format('woff'),
		         url('montserrat/montserrat-regular-webfont.ttf') format('truetype'),
		         url('montserrat/montserrat-regular-webfont.svg#montserratregular') format('svg');
		    font-weight: normal;
		    font-style: normal;
		
		}
		
		* {
			font-family			: 'montserratregular', sans-serif; 
			font-size			: 16px; 
			color				: white;
			background-repeat	: no-repeat;
		}
		a {color: white;}
		
        html, body {
            padding     		: 0;
            margin      		: 0;
            background  		: #fff;
        }

        .main {
        	width				: 100%;
        	height				: 40px;
        	background-color	: #85AA03;
        }
        .navitem {
        	display				: inline-block;
        	padding				: 10px 0 10px 0;
        	color				: white;
        }
         .bgicon a{
        	padding           	: 10px 30px 10px 40px !important;
        	background-position	: 10px 7px;
        }
        #go_head {
            padding     		: 0;
            margin      		: 0;
        }
        #homelink a{ 
        	background-image	: url('img/accueil.png');
        }
        #catalogue a{
        	background-image	: url('img/catalogue.png');
        }
        #map a{
        	background-image	: url('img/carte.png');
        }
        #login a{
        	background-image	: url('img/user.png');
        } 
        
        #go_home img {
            border 				: none;
        }
        #go_head ul {
            float    			: left;
            list-style 		 	: none;
            margin    			: 0;
            padding   			: 0px;
            display   			: inline;
        }
        #go_head li {
            margin   			: 0;
            padding   			: 0;
            display   			: block;
            float				: left;
            transition			: right .3s ease, left .3s ease, background .3s ease;
            background			: transparent;
        }
       #go_head li a {
            display            	: block;
            padding           	: 10px 30px 10px;
            margin             	: 0px;
            text-decoration    	: none;

        }
         #go_head li a:hover {
            background-color 	: #4D4D4D;
            border-bottom    	: none;
        }
        #go_head ul li.active a {
            background-color 	: #4D4D4D;
        }
        #go_head .logged {
            width         		: auto;
            float         		: right;
        }
        #go_head .logged span{
            color				: #000;
        }
        #go_head .logged span.light{
            color				: #ddd;
        }
        #go_head .logged {
            position 			: relative;
        }
        #go_head .logged div {

        }
        #go_head .logged a {;
        }
        #go_head ul ul {
            display				: none;
        }
        #go_head li li {
            right				: auto;
        }
        #go_head .expanded {

            background 			 : white;
            z-index    			 : 1;
            min-width  			 : 20em;
        }
        #go_head .expanded ul{
            display				: block;
        }
        #go_head .expanded > a,
        #go_head .expanded ul{
            margin-top			: 0;
            float				: right;
        }
        #go_head .expanded > a {
            color				: white;
            background			: #666;
        }
        #go_head .group > a:after {
           content				: ' »';
        }
        #go_head .expanded > a:before {
            content				: '« ';
        }
        #go_head .expanded > a:after {
            content				: '';
        }
    </style>

</head>


<body>

	<div class="main">
    <div id="go_head">

        <ul>
	        <li class="navitem bgicon" id="homelink">
		        <a href="#" id="go_home" title="<fmt:message key='go.home'/>"><fmt:message key='logo'/> </a>
	        </li>
        <c:choose>
            <c:when test='<%= active.equals("geonetwork") %>'>
            <li class="active navitem bgicon" id="catalogue"><a href="/geonetwork/"><fmt:message key="catalogue"/></a></li>
            </c:when>
            <c:otherwise>
            <li class="navitem bgicon" id="catalogue"><a href="/geonetwork/"><fmt:message key="catalogue"/></a></li>
            </c:otherwise>
        </c:choose>

        <c:choose>
            <c:when test='<%= active.equals("mapfishapp") %>'>
            <li class="active navitem bgicon" id="map"><a><fmt:message key="viewer"/></a></li>
            </c:when>
            <c:otherwise>
            <li class="navitem bgicon" id="map"><a href="/mapfishapp/"><fmt:message key="viewer"/></a></li>
            </c:otherwise>
        </c:choose>

        <c:choose>
            <c:when test='<%= extractor == true %>'>
            <c:choose>
                <c:when test='<%= active.equals("extractorapp") %>'>
            <li class="active navitem" id="services"><a><fmt:message key="extractor"/></a></li>
                </c:when>
                <c:otherwise>
            <li class="navitem" id="services"><a href="/extractorapp/"><fmt:message key="extractor"/></a></li>
                </c:otherwise>
            </c:choose>
            </c:when>
        </c:choose>

        <c:choose>
            <c:when test='<%= active.equals("geoserver") %>'>
            <li class="active navitem" id="geoserver"><a href="/geoserver/web/"><fmt:message key="services"/></a></li>
            </c:when>
            <c:otherwise>
            <li class="navitem" id="geoserver"><a href="/geoserver/web/"><fmt:message key="services"/></a></li>
            </c:otherwise>
        </c:choose>

        <c:choose>
            <c:when test='<%= admin == true %>'>
            <li class="group navitem"> 
                <a href="#admin"><fmt:message key="admin"/></a>
                <ul>

                    <c:choose>
                        <c:when test='<%= catadmin == true %>'>
                        <c:choose>
                            <c:when test='<%= active.equals("geonetwork") %>'>
                        <li class="active"><a href="/geonetwork/srv/eng/admin"><fmt:message key="catalogue"/></a></li>
                            </c:when>
                            <c:otherwise>
                        <li class="navitem"><a href="/geonetwork/srv/<%= lang %>/admin"><fmt:message key="catalogue"/></a></li> <!-- FIXME: GN3 -->
                            </c:otherwise>
                        </c:choose>
                        </c:when>
                    </c:choose>

                    <c:choose>
                        <c:when test='<%= extractorappadmin == true %>'>
                        <c:choose>
                            <c:when test='<%= active.equals("extractorappadmin") %>'>
                        <li class="active navitem"><a href="/extractorapp/admin/"><fmt:message key="extractor"/></a></li>
                            </c:when>
                            <c:otherwise>
                        <li class="navitem"><a href="/extractorapp/admin/"><fmt:message key="extractor"/></a></li>
                            </c:otherwise>
                        </c:choose>
                        </c:when>
                    </c:choose>

                    <c:choose>
                        <c:when test='<%= analyticsadmin == true %>'>
                        <c:choose>
                            <c:when test='<%= active.equals("analytics") %>'>
                        <li class="active navitem"><a href="/analytics/">analytics</a></li>
                            </c:when>
                            <c:otherwise>
                        <li class="navitem"><a href="/analytics/">analytics</a></li>
                            </c:otherwise>
                        </c:choose>
                        </c:when>
                    </c:choose>

                    <c:choose>
                        <c:when test='<%= ldapadmin == true %>'>
                        <c:choose>
                            <c:when test='<%= active.equals("ldapadmin") %>'>
                        <li class="active navitem"><a><fmt:message key="users"/></a></li>
                            </c:when>
                            <c:otherwise>
                        <li class="navitem"><a href="<%= ldapadm %>/privateui/"><fmt:message key="users"/></a></li>
                            </c:otherwise>
                        </c:choose>
                        </c:when>
                    </c:choose>

                </ul>
            </li>
            </c:when>
        </c:choose>
        </ul>

        <c:choose>
            <c:when test='<%= anonymous == false %>'>
	        <li id="login" class="logged navitem bgicon">
	            <a href="<%=ldapadm %>account/userdetails"><%=request.getHeader("sec-username") %></a><span class="light"> | </span><a href="/j_spring_security_logout"><fmt:message key="logout"/></a>
	        </li>
            </c:when>
            <c:otherwise>
		        <li id="login" class="logged navitem bgicon">
		            <a id="login_a"><fmt:message key="login"/></a>
		        </li>
            </c:otherwise>
        </c:choose>
    </div>

    <script>
        (function(){
            // required to get the correct redirect after login, see https://github.com/georchestra/georchestra/issues/170
            var url,
                a = document.getElementById("login_a"),
                cnxblk = document.querySelector('#go_head p.logged');
            if (a !== null) {
                url = parent.window.location.href;
                if (/\/cas\//.test(url)) {
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
                var li = a.parentNode;
                var ul = li.querySelectorAll('ul');
                a.addEventListener('click', function(e) {
                    each(
                        document.querySelectorAll('#go_head li'),
                        function(l){ l.classList.remove('active');}
                    );
                    if (ul[0]) {
                        e.stopImmediatePropagation();
                        e.stopPropagation();
                        e.preventDefault();
                        li.classList.toggle('expanded');
                        // hide/show connexion block:
                        cnxblk.style.visibility = 
                            cnxblk.style.visibility == '' ? 'hidden' : '';
                    } else {
                        a.parentNode.className = 'active';
                    }
                });
            });
        })();
    </script>
</div>
</body>
</html>
