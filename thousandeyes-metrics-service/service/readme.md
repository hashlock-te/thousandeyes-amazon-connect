
```bash
#sls create --template aws-nodejs --path myService
# Setup AWS profile/creds in ~/.aws/credentials
export AWS_PROFILE="serverless-admin"
# create package.json
npm install
npm install axios
sls deploy

#Test
curl -s https://jur5bq3i8a.execute-api.us-east-1.amazonaws.com/dev/status

```
