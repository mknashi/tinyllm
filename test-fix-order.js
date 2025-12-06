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

console.log('Testing fix order: unclosed strings BEFORE comment removal\n');
console.log('Issues in input:');
console.log('  - Line 17: Missing closing quote on client_id value');
console.log('  - Line 33: Missing comma after parameters object');
console.log('  - Line 46: URL should NOT be truncated\n');

const parser = new JSONParser();
const result = parser.fix(testJSON);

console.log('Success:', result.success);
console.log('Fixes applied:', result.fixes);

if (result.success) {
  const parsed = JSON.parse(result.fixed);
  console.log('\n✅ FIXED SUCCESSFULLY!\n');

  console.log('URL 1:', parsed.nodes[0].parameters.url);
  console.log('URL 1 intact?', parsed.nodes[0].parameters.url.includes('login.salesforce.com') ? '✅ YES' : '❌ NO');

  console.log('\nURL 2:', parsed.nodes[1].parameters.url);
  console.log('URL 2 intact?', parsed.nodes[1].parameters.url.includes('my.salesforce.com') ? '✅ YES' : '❌ NO');
  console.log('URL 2 complete?', parsed.nodes[1].parameters.url.includes('channels') ? '✅ YES' : '❌ NO (TRUNCATED!)');

  console.log('\nClient ID value:', parsed.nodes[0].parameters.bodyParametersUi.parameter[1].value);
  console.log('Quote added?', parsed.nodes[0].parameters.bodyParametersUi.parameter[1].value === '<YOUR_CLIENT_ID>' ? '✅ YES' : '❌ NO');

} else {
  console.log('\n❌ FAILED TO FIX');
  console.log('Errors:', result.errors);
}
