package org.georchestra.security.custom;

import java.io.IOException;

import javax.jws.WebService;
import javax.jws.soap.SOAPBinding;
import javax.xml.datatype.DatatypeConfigurationException;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.core.io.ClassPathResource;

import org.georchestra.security.custom.utils.PropertiesUtil;

import fr.portailps.helpers.notification.transport.VIHFToken;
import fr.portailps.helpers.notification.transport.VIHFTokenPhpWrapper;
import fr.portailps.helpers.token.GetAuthenticationDataClient;
import fr.portailps.helpers.token.exception.ArtifactResolverException;


/**
 * Service web qui peut être utilisé comme proxy pour appeler le service de résolution de jeton de manière sécurisée
 * par une autre application qui n'implémente pas de sécurisation.
 * @author gsimonet
 *
 */
@WebService(name = "NotificationServiceSoap")
@SOAPBinding(parameterStyle = SOAPBinding.ParameterStyle.BARE)
public class TokenService {

	private static final Log LOG = LogFactory.getLog(TokenService.class.getName());
	 
	private GetAuthenticationDataClient lClient;

	public TokenService() throws DatatypeConfigurationException, IOException {
		GetAuthenticationDataClient.initBus("cxf-config.xml");

		String trustCertLocation = PropertiesUtil.getPropertyAsString("trust.certificate.location");
		boolean secured = PropertiesUtil.getPropertyAsBoolean("secured");
		String endPointAddress = PropertiesUtil.getPropertyAsString("end.point.address.tokenProvider");
		lClient = new GetAuthenticationDataClient(new ClassPathResource(trustCertLocation), secured, endPointAddress);
	}
	
	/**
	 * Résoud un jeton et renvoie les données qu'il contient.
	 * @param artifactId Identifiant du jeton.
	 * @return jeton
	 * @throws ArtifactResolverException
	 */
	public VIHFTokenPhpWrapper getTokenById(String artifactId) throws ArtifactResolverException {
		VIHFToken token = null;
		
		token = lClient.resolveArtifact(artifactId);
		
		VIHFTokenPhpWrapper w = new VIHFTokenPhpWrapper(token);
		
		return w;
	}
}
