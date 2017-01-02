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

package org.georchestra.ldapadmin.ws.custom;


import org.georchestra.ldapadmin.ws.newaccount.AccountFormBean;


/**
 * This model maintains the account form data.
 *
 * @author Mauricio Pazos
 *
 */
public class AccountFromTokenFormBean extends AccountFormBean{

	
	/**
	 * 
	 */
	private static final long serialVersionUID = 2288801729506452758L;
	
	
	private String techId;

	/**
	 * @return the techId
	 */
	public String getTechId() {
		return techId;
	}


	/**
	 * @param techId the techId to set
	 */
	public void setTechId(String techId) {
		this.techId = techId;
	}


	@Override
	public String toString() {
		return "AccountFormBean [uid=" + uid + ", firstName=" + firstName
				+ ", surname=" + surname + ", org=" + org + ", title=" + title
				+ ", email=" + email
				+ ", phone=" + phone + ", description=" + description + ", password="
				+ password + ", confirmPassword=" + confirmPassword
				+ ", recaptcha_challenge_field=" + recaptcha_challenge_field
				+ ", recaptcha_response_field=" + recaptcha_response_field
				+ "]";
	}



}
