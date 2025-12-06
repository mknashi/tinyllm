import { JSONParser } from './src/parsers/json-parser.js';

const testJSON = `{
  "name": "Salesforce CMS to Data Cloud 20250613190655",
  "nodes": [
    {
      "parameters": {
        "requestMethod": "POST",
        "url": "https://login.salesforce.com/services/oauth2/token",
        "options": {},
        "bodyParametersUi": {
          "parameter": [
            {
              "name": "grant_type",
              "value": "password"
            },
            {
              "name": "client_id",
              "value": "<YOUR_CLIENT_ID>"
            },
            {
              "name": "client_secret",
              "value": "<YOUR_CLIENT_SECRET>"
            }
            {
              "name": "username",
              "value": "<YOUR_USERNAME>"
            },
            {
              "name": "password",
              "value": "<YOUR_PASSWORD><SECURITY_TOKEN>"
            }
          ]
        }
      }
      "name": "Get Token",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 1,
      "position": [
        200,
        300
      ]
    }
  ],
  "connections": {},
  "active": false,
  "settings": {},
  "tags": []
}`;

console.log('Testing TinyLLM local version...\n');

const parser = new JSONParser();
const result = parser.fix(testJSON);

console.log('Success:', result.success);
console.log('\nFixes applied:', result.fixes);

if (result.success) {
  const parsed = JSON.parse(result.fixed);
  console.log('\n✅ FIXED SUCCESSFULLY!');
  console.log('URL:', parsed.nodes[0].parameters.url);
  console.log('URL intact?', parsed.nodes[0].parameters.url.includes('https://login.salesforce.com') ? '✅ YES' : '❌ NO');
  console.log('\nFirst 500 chars of fixed JSON:');
  console.log(result.fixed.substring(0, 500));
} else {
  console.log('\n❌ FAILED TO FIX');
  console.log('Errors:', result.errors);
  console.log('\nFirst 300 chars of attempted fix:');
  console.log(result.fixed.substring(0, 300));
}
