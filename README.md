# Serverless AWS Custom Auth Plugin

=============================

A serverless plugin that adds the possibility to configure AWS_IAM or Cognito Auth for your API Gateway endpoints and 'Invoke with caller credentials'. The reason why we made this plugin is because by the default serverless will generate a random authorizer name from the Cognito User Pool, there is no way to configure Authorizer ID or specify a name of new authorizer to be created if not exist.

**Note:** Serverless *v1.0.0* or higher is required.

## Installation

Add the plugin to your package.json's devDependencies and to the plugins array in your serverless.yml file. After installation the plugin will automatically hook into the deployment process.

```
npm install serverless-custom-auth-plugin --save-dev
```

```
plugins:
  - other plugins
  - serverless-custom-auth-plugin
```

## Usage

First, you will need to add your custom Authorizer with a friendly name

```yml
XXXAuthorizer:
  Type: AWS::ApiGateway::Authorizer
  Properties:
    AuthorizerUri:
      Ref: CognitoUserPoolXXX
    IdentitySource: method.request.header.Authorization
    Name: Friendly Name of this authorizer
    ProviderARNs:
      - Ref: CognitoUserPoolXXX
    RestApiId:
      Ref: ApiGatewayRestApi
    Type: COGNITO_USER_POOLS
```

and configure your event

```yml
myFunc:
  handler: myFunc.get
  name: ${self:provider.stage}-myFunc-get-item
  memorySize: 128
  events:
    - http:
      method: GET
      path: api-path
      cors: true 
      invokeWithCallerCredentials: true
      useIAMAuth: true // Use IAM auth
      useCognitoAuth: true // Or, we can use Cognito Auth
      authorizerId:
        Ref: XXXAuthorizer // Your authorizer resource in serverless.yml
```

## License

MIT
