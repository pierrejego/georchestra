/*
 * Copyright (C) 2009-2016 by the geOrchestra PSC
 *
 * This file is part of geOrchestra.
 *
 * geOrchestra is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option)
 * any later version.
 *
 * geOrchestra is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * geOrchestra.  If not, see <http://www.gnu.org/licenses/>.
 */

package org.georchestra.security.custom;

import java.io.IOException;
import java.util.Map;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.ldap.core.DirContextOperations;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.ldap.search.LdapUserSearch;

import fr.portailps.helpers.notification.transport.VIHFTokenPhpWrapper;
import fr.portailps.helpers.token.exception.ArtifactResolverException;

public class TokenAuthenticationFilter implements Filter {

	protected final Log logger = LogFactory.getLog(getClass());

	private LdapUserSearch userSearch;

	private TokenService tokenService;

	@Override
	public void init(FilterConfig fc) throws ServletException {

	}

	@Override
	public void doFilter(ServletRequest req, ServletResponse res, FilterChain fc) throws IOException, ServletException {

		logger.debug(" Do filter - Verifying if artifacId exist");

		SecurityContext context = SecurityContextHolder.getContext();
		if (context.getAuthentication() != null && context.getAuthentication().isAuthenticated()) {
			logger.debug(" User all ready authenticated");
		} else {
			Map<String, String[]> params = req.getParameterMap();

			// getToken id from url
			if (!params.isEmpty() && params.containsKey("ArtifactId")) {
				
				logger.debug("Params : " + params);
				String token = params.get("ArtifactId")[0];
				logger.debug("token : " + token);

				if (token != null) {

					VIHFTokenPhpWrapper user = null;
					try {
						user = tokenService.getTokenById(token);
					} catch (ArtifactResolverException e) {
						logger.error("Invalid token " + token);
						logger.error(e.getMessage());
					}

					if (user != null) {

						// Display all user information
						if (logger.isDebugEnabled()) {
							logger.debug("Token authentication. Check Token: " + token);
							logger.debug("user login: " + user.getToken().getSsoUserLogin());
							logger.debug("user prénom: " + user.getToken().getSsoUserFirstName());
							logger.debug("user nom: " + user.getToken().getSsoUserLastName());
							logger.debug("user mail: " + user.getToken().getSsoMail());
							logger.debug("user phoneNumber: " + user.getToken().getSsoPhoneNumber());
							logger.debug("user techId: " + user.getToken().getSsoUserTechId());
						}

						// Find user in ldap
						DirContextOperations userData;
						try {
							 userData = userSearch.searchForUser(user.getToken().getSsoUserTechId());
							 
							 // Add authentification information for CAS server
							 

						} catch (UsernameNotFoundException e) {
							// User not found in ldap
							logger.info("User not find in ldap : " + user.getToken().getSsoUserLogin(), e);

							// redirect to sign in form with pre filed information
							logger.debug("Redirect to new account page ");
							HttpServletRequest httpRequest = (HttpServletRequest) req;

							// add parameter to URL because session is destroyed before arriving to ldapadmin
							// TODO check why and change this
							StringBuilder redirectUrl = new StringBuilder();
							redirectUrl.append("/ldapadmin/account/newfromps");
							redirectUrl.append("?firstName=");
							redirectUrl.append(user.getToken().getSsoUserFirstName());
							redirectUrl.append("&surname=");
							redirectUrl.append(user.getToken().getSsoUserLastName());
							redirectUrl.append("&email=");
							redirectUrl.append(user.getToken().getSsoMail());
							redirectUrl.append("&phone=");
							redirectUrl.append(user.getToken().getSsoPhoneNumber());
							redirectUrl.append("&uid=");
							redirectUrl.append(user.getToken().getSsoUserLogin());
							redirectUrl.append("&techId=");
							redirectUrl.append(user.getToken().getSsoUserTechId());
								
							logger.debug("URL to redirect : " + redirectUrl.toString() );
							HttpServletResponse httpResponse = (HttpServletResponse) res;
							httpResponse.sendRedirect(redirectUrl.toString());
							return;

						}
					} else {
						logger.error("No user found for this token on portail ps side" + token);
					}
				}
			}
		}

		fc.doFilter(req, res);
	}

	@Override
	public void destroy() {

	}

	/**
	 * @param userSearch
	 *            the userSearch to set
	 */
	public void setUserSearch(LdapUserSearch userSearch) {
		this.userSearch = userSearch;
	}

	/**
	 * @param tokenService
	 *            the tokenService to set
	 */
	public void setTokenService(TokenService tokenService) {
		this.tokenService = tokenService;
	}

}