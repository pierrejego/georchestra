package org.georchestra.security.custom.utils;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;


public class PropertiesUtil {
	
	
	private static final Log LOG = LogFactory.getLog(PropertiesUtil.class.getName());
	
	/**
	 * Emplacement du fichier ressources.
	 * TODO change this value to read in conf folder
	 */
	public static final String RESOURCE_FILE = "/config.properties";

	/**
	 * Valeur par défaut lorsque le message sollicité n'est pas définit dans les ressources.
	 */
	private static final String DEFAULT_RESSOURCE_VALUE = "Clé non valide";

	/**
	 * Propriétés chargées depuis le fichier de ressources.
	 */
	private static Properties properties;

	/**
	 * Retourne la valeur associée à la clé dans la liste des propriétés de l'application.
	 * 
	 * @param key clé
	 * 
	 * @return valeur
	 */
	public static String getPropertyAsString(String key) {
		return getProperties(key);
	}
	
	public static Boolean getPropertyAsBoolean(String key) {
		return Boolean.valueOf(getProperties(key));
	}
	
	/**
	 * Retourne la valeur associée à la clé dans la liste des propriétés de l'application.
	 * 
	 * @param key clé
	 * @param params params
	 * 
	 * @return valeur
	 */
	private static String getProperties(String key) {
		if (properties == null) {
			properties = new Properties();
			try {
				InputStream stream = PropertiesUtil.class.getResourceAsStream(RESOURCE_FILE);
				properties.load(stream);
				stream.close();
			} catch (IOException e) {
				LOG.error("Une erreur s'est produite lors du chargement des propriétés." + e.getMessage(), e);
			} catch (Exception e) {
				LOG.error("AUTRE EXCEPTION " + e.getMessage(), e);
			}
		}
		return properties.getProperty(key, DEFAULT_RESSOURCE_VALUE);
	}

}
