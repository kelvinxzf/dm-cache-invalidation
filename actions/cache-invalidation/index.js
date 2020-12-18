const fetch = require('node-fetch')
const { Core } = require('@adobe/aio-sdk')
const { errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs } = require('../utils')
const logger = Core.Logger('main', { level: 'info' })

// main function that will be executed by Adobe I/O Runtime
async function main(params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    // 'info' is the default level if not set
    logger.info('Inside DM CDN cache invalidation main')
    if (Object.keys(params).length > 0) {
      const event = params.event;
      logger.info(JSON.stringify(event));
      const contentPath = event['activitystreams:object']['xdmAsset:path'];

      if (event['@type'] == 'xdmPublished' && contentPath.startsWith("/content/dam")) {
        logger.info("published content path:" + contentPath);
        const assetMetadata = await getAssetMetadata(params.aemAuthorHost, params.aemBasicAuth, contentPath);
        logger.info("asset dam:scene7File: " + assetMetadata['dam:scene7File']);
        invalidateCache(params.dmAPIEp, assetMetadata['dam:scene7File']);
      }
    }

  } catch (error) {
    // log any server errors
    logger.error(error)
    // return with 500
    return errorResponse(500, 'server error', logger)
  }
}

async function getAssetMetadata(aemAuthorHost, aemBasicAuth, contentPath) {
  const metadataUrl = aemAuthorHost + contentPath + "/jcr:content/metadata.json";
  const response = await fetch(metadataUrl, {
    method: 'GET',
    headers: {
      'Authorization': 'Basic ' + aemBasicAuth
    }
  });

  const json = await response.json();
  logger.info("asset metadata: " + JSON.stringify(json));
  return json;
}

async function invalidateCache(dmAPIEp, scene7File) {
  var dmRequestXml =
    '<Request xmlns="http://www.scene7.com/IpsApi/xsd/2019-09-10-beta">' +
    '    <authHeader xmlns="http://www.scene7.com/IpsApi/xsd/2019-09-10-beta">' +
    '         <user>dmintdev@microsoft.com</user>' +
    '         <password>replaceme</password>' +
    '         <appName>Adobe Experience Manager</appName>' +
    '         <appVersion>6.5.6.0</appVersion>' +
    '         <faultHttpStatusCode>200</faultHttpStatusCode>' +
    '    </authHeader>' +
    '    <cdnCacheInvalidationParam xmlns="http://www.scene7.com/IpsApi/xsd/2019-09-10-beta">' +
    '         <companyHandle>c|229175</companyHandle>' +
    '         <urlArray>' +
    '             <items>https://cdn-dynmedia-1.microsoft.com/is/image/<ID></items>' +
    '             <items>https://cdn-dynmedia-1.microsoft.com/is/image/<ID>?$1260x726$</items>' +
    '         </urlArray>' +
    '    </cdnCacheInvalidationParam>' +
    '</Request>';

  dmRequestXml = dmRequestXml.replace(/<ID>/g, scene7File);
  logger.info("dmRequestXml: " + dmRequestXml);
  const response = await fetch(dmAPIEp, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml'
    },
    body: dmRequestXml
  });

  const responseXml = await response.text();
  logger.info("invalidation response: " + responseXml);
}

exports.main = main
