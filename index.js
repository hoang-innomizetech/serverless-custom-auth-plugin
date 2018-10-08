'use strict';

/**
 * Adds the possibility to configure AWS_IAM or Cognito Auth for your API Gateway endpoints
 * and "Invoke with caller credentials"
 *
 * Usage:
 *
 *   myFunc:
 *     handler: myFunc.get
 *     name: ${self:provider.stage}-myFunc-get-item
 *     memorySize: 128
 *     events:
 *       - http:
 *           method: GET
 *           path: api-path
 *           cors: true 
 *           invokeWithCallerCredentials: true
 *           useIAMAuth: true // Use IAM auth
 *           useCognitoAuth: true // Or, we can use Cognito Auth
 *           authorizerId:
 *              Ref: CognitoUserPoolMembersAuthorizer
 */
class ServerlessCustomAuthPlugin {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;
        this.hooks = {
            'deploy:compileEvents': this._compileEvents.bind(this)
        };

        // This plugin only supported for AWS provider
        this.provider = this.serverless.getProvider('aws');
    }

    _capitalizeAlphaNumericPath(path) {
        path = path.toLowerCase();
        path = path.replace(/-/g, 'Dash');
        path = path.replace(/\{(.*)\}/g, '$1Var');
        path = path.replace(/[^0-9A-Za-z]/g, '');
        path = path.charAt(0).toUpperCase() + path.slice(1);

        return path;
    }

    _compileEvents() {
        const tmp = this.serverless.service.provider.compiledCloudFormationTemplate;
        const resources = tmp.Resources;
        const iamFunctions = this.serverless.service.custom.useApiGatewayIAMAuthForLambdaFunctions;

        this.serverless.service.getAllFunctions().forEach((functionName) => {
            const functionObject = this.serverless.service.functions[functionName];

            functionObject.events.forEach(event => {
                if (!event.http) { return; }
                if (event.http.useIAMAuth || event.http.invokeWithCallerCredentials
                    || event.http.useCognitoAuth) {
                    let path;
                    let method;

                    if (typeof event.http === 'object') {
                        path = event.http.path;
                        method = event.http.method;
                    } else if (typeof event.http === 'string') {
                        path = event.http.split(' ')[1];
                        method = event.http.split(' ')[0];
                    }

                    const resourcesArray = path.split('/');

                    const normalizedResourceName = resourcesArray.map(this._capitalizeAlphaNumericPath).join('');
                    const normalizedMethod = method[0].toUpperCase() + method.substr(1).toLowerCase();
                    const methodName = `ApiGatewayMethod${normalizedResourceName}${normalizedMethod}`;

                    if (event.http.useIAMAuth) {
                        try {
                            resources[methodName].Properties.AuthorizationType = 'AWS_IAM';
                        } catch (e) {
                            throw new Error("Bad methodName: " + methodName);
                        }
                    } else if (event.http.useCognitoAuth) {
                        try {
                            resources[methodName].Properties.AuthorizerId = event.http.authorizerId;
                            resources[methodName].Properties.AuthorizationType = 'COGNITO_USER_POOLS';
                        } catch (e) {
                            throw new Error("Bad methodName: " + methodName);
                        }
                    }

                    if (event.http.invokeWithCallerCredentials) {
                        try {
                            resources[methodName].Properties.Integration.Credentials = 'arn:aws:iam::*:user/*';
                        } catch (e) {
                            throw new Error("Bad methodName: " + methodName);
                        }
                    }
                }
            });
        });
    }
}

module.exports = ServerlessCustomAuthPlugin;
