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

package org.georchestra.mapfishapp.model;

import java.sql.Connection;
import java.sql.SQLException;

import org.apache.commons.dbcp.BasicDataSource;
import org.georchestra.commons.configuration.GeorchestraConfiguration;
import org.springframework.beans.factory.annotation.Autowired;

public class ConnectionPool {

	private BasicDataSource basicDataSource;

	@Autowired
	private GeorchestraConfiguration georchestraConfiguration;

	private String jdbcUrl;
	private String jdbcDriver;
	
	private final String PSQLDRIVER = "org.postgresql.Driver";

	public ConnectionPool() {
	}

	/**
	 * ConnectionPool with only jdbcUrl param will use postgresqlDriver
	 * 
	 * @param jdbcUrl string url to be used ini BasicDatasource configuration
	 */
	public ConnectionPool(String jdbcUrl) {
		this.jdbcUrl = jdbcUrl;
		this.jdbcDriver = PSQLDRIVER;
	}

	/**
	 * Constructor with jdbcUrl and jdbcDriver
	 *  
	 * @param jdbcUrl
	 * @param jdbcDriver must be a String driver known by BasicDatasource 
	 * 			for exemple "org.postgresql.Driver" for postgresql or oracle.jdbc.driver.OracleDriver for Oracle
	 */
	public ConnectionPool(String jdbcUrl, String jdbcDriver) {
		this.jdbcUrl = jdbcUrl;
		this.jdbcDriver = jdbcDriver;
	}

	/**
	 * Init Connection pool
	 */
	public void init() {
		String actualJdbcUrl = jdbcUrl;
		String actualJdbcDriver = jdbcDriver;

		if (georchestraConfiguration.activated()) {
			String supersededJdbcUrl = georchestraConfiguration.getProperty("jdbcUrl");
			if (supersededJdbcUrl != null) {
				actualJdbcUrl = supersededJdbcUrl;
			}
			String supersededJdbcDriver = georchestraConfiguration.getProperty("jdbcDriver");
			if (supersededJdbcDriver != null) {
				actualJdbcDriver = supersededJdbcDriver;
			}
		}

		basicDataSource = new BasicDataSource();
		basicDataSource.setDriverClassName(actualJdbcDriver);
		basicDataSource.setTestOnBorrow(true);
		basicDataSource.setPoolPreparedStatements(true);
		basicDataSource.setMaxOpenPreparedStatements(-1);
		basicDataSource.setDefaultReadOnly(false);
		basicDataSource.setDefaultAutoCommit(true);
		basicDataSource.setUrl(actualJdbcUrl);
	}

	/**
	 * Set jdbcUrl to be used in basic datasource settings
	 * 
	 * @param jdbcUrl
	 */
	public void setJdbcUrl(String jdbcUrl) {
		this.jdbcUrl = jdbcUrl;
	}

	/**
	 * Set JdbcDriver to be used in basic datasource settings
	 *
	 * @param jdbcDriver
	 */
	public void setJdbcDriver(String jdbcDriver) {
		this.jdbcDriver = jdbcDriver;
	}

	/**
	 * 
	 * @return connection from datasource
	 * @throws SQLException
	 */
	public Connection getConnection() throws SQLException {
		return basicDataSource.getConnection();
	}

}
