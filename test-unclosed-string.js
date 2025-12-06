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
              "value": "<YOUR_CLIENT_ID>
            },
            {
              "name": "client_secret",
              "value": "<YOUR_CLIENT_SECRET>"
            },
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
    },
    {
      "parameters": {
        "requestMethod": "GET",
        "url": "https://<your-instance>.my.salesforce.com/services/data/v60.0/connect/cms/delivery/channels/<channelId>/contents",
        "options": {},
        "headerParametersUi": {
          "parameter": [
            {
              "name": "Authorization",
              "value": "Bearer {{$node[\\"Get Token\\"].json[\\"access_token\\"]}}"
            }
          ]
        }
      },
      "name": "Get CMS Content",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 1,
      "position": [
        500,
        300
      ]
    }
  ],
  "connections": {
    "Get Token": {
      "main": [
        [
          {
            "node": "Get CMS Content",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": false,
  "settings": {},
  "tags": []
}`;

console.log('Testing unclosed string fix...\n');
console.log('Error on line 17: missing closing quote after "<YOUR_CLIENT_ID>"\n');

const parser = new JSONParser();
const result = parser.fix(testJSON);

console.log('Success:', result.success);
console.log('Fixes applied:', result.fixes);

if (result.success) {
  const parsed = JSON.parse(result.fixed);
  console.log('\n✅ FIXED SUCCESSFULLY!');
  console.log('\nLine 17 fixed value:', parsed.nodes[0].parameters.bodyParametersUi.parameter[1].value);
  console.log('Expected: <YOUR_CLIENT_ID>');
  console.log('Match:', parsed.nodes[0].parameters.bodyParametersUi.parameter[1].value === '<YOUR_CLIENT_ID>' ? '✅' : '❌');
} else {
  console.log('\n❌ FAILED TO FIX');
  console.log('Errors:', result.errors);
  console.log('\nShowing line 17 area:');
  const lines = result.fixed.split('\n');
  console.log(lines.slice(15, 20).join('\n'));
}
