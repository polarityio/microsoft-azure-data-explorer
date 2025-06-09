const { KustoConnectionStringBuilder, Client: KustoClient, ClientRequestProperties } = require('azure-kusto-data');
const { QueryExecutionError } = require('./query-execution-error');
const async = require('async');
const _ = require('lodash');

let Logger;
let kustoClient;
let summaryFieldsCompiled = null;
let detailFieldsCompiled = null;
let previousSummaryFields = null;
let previousDetailFields = null;

let previousCredentialString = null;

function startup(logger) {
  Logger = logger;
}

function createCredentialString(options) {
  return options.clusterUrl + options.clientId + options.clientSecret + options.tenantId;
}

async function doLookup(entities, options, cb) {
  const lookupResults = [];
  Logger.trace({ entities, options }, 'doLookup');

  try {
    if (previousDetailFields === null || previousDetailFields !== options.detailFields) {
      detailFieldsCompiled = _compileFieldsOption(options.detailFields);
    }

    if (previousSummaryFields === null || previousSummaryFields !== options.summaryFields) {
      summaryFieldsCompiled = _compileFieldsOption(options.summaryFields, false);
    }
  } catch (compileError) {
    return cb({
      detail: compileError.message
    });
  }

  // Only create a new client if the credentials have changed or we haven't
  // created the client yet.
  const currentCredentialString = createCredentialString(options);
  if (!kustoClient || previousCredentialString !== currentCredentialString) {
    try {
      /* -------------------------------------------------
       * Build Kusto client (AAD application-key auth)
       * ------------------------------------------------- */
      const kcsb = KustoConnectionStringBuilder.withAadApplicationKeyAuthentication(
        options.clusterUrl,
        options.clientId,
        options.clientSecret,
        options.tenantId
      );
      kustoClient = new KustoClient(kcsb);
    } catch (loadError) {
      return cb(loadError);
    }
  }

  previousCredentialString = currentCredentialString;

  try {
    await async.eachLimit(entities, 5, async (entity) => {
      if (entity.isIP && !options.searchPrivateIps && isPrivateIp(entity)) {
        return;
      }

      const requestProps = new ClientRequestProperties();
      let kustoQuery = options.query;

      // If the query includes `polarity_entity_value` this is the string we need to parameterize
      if (options.query.includes('polarity_entity_value')) {
        // Note that queries without `polarity_entity_value` don't make much sense because the query will not
        // be looking up data related to the entity value without `polarity_entity_value` present.  However,
        // to facilitate simple test queries, we don't automatically include the query_parameters declaration.
        // If you include the declaration without using the parameter, you get a 400 query error.
        kustoQuery = 'declare query_parameters (polarity_entity_value:string); ' + kustoQuery;

        // Bind the parameter value
        requestProps.setParameter('polarity_entity_value', entity.value);

        // Set the query timeout in milliseconds
        requestProps.setTimeout(options.queryTimeout);
      }

      Logger.trace({ kustoQuery }, 'Kusto Query to Execute');
      let response;
      try {
        response = await kustoClient.execute(options.dbName, kustoQuery, requestProps);
      } catch (queryError) {
        const kustoError = formatKustoError(queryError, options);
        throw new QueryExecutionError(kustoError, kustoQuery, entity.value);
      }

      const primaryResults = response.primaryResults[0];
      const rows = [];
      for (const row of primaryResults.rows()) {
        rows.push(row);
      }

      Logger.trace(rows, 'Primary Data Query Results');

      if (rows.length === 0) {
        lookupResults.push({
          entity,
          data: null
        });
      } else {
        lookupResults.push({
          entity,
          data: {
            summary: _getSummaryTags(rows, options),
            details: {
              rows: rows.map((row, index) => {
                return {
                  // Processed data for display
                  details: _getDetailBlockValues(row),
                  rowNumber: ++index,
                  title: _.get(row, options.documentTitleField, ''),
                  // Raw data returned from query
                  data: row
                };
              })
            }
          }
        });
      }
    });
  } catch (error) {
    Logger.error({ error }, 'doLookup error');
    return cb(error);
  }

  Logger.trace({ lookupResults }, 'doLookup results');

  cb(null, lookupResults);
}

const parseErrorToReadableJSON = (error) => JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));

/**
 * Turn an ADX / Kusto failure into a readable string.
 * The library throws an Error that still contains the HTTP response.
 * @param {unknown} err
 * @returns {string}
 */
function formatKustoError(err, options) {
  // axios-style: err.response.data
  const srv = err?.response?.data?.error ?? err?.response?.data;

  if (srv) {
    // Typical structure:
    // {
    //   "error":{
    //     "code":"General_SyntaxError",
    //     "message":"Query could not be parsed: ...",
    //     "innererror":{"@message":"Bad token: ...", "@type":"Microsoft..." }
    //   }
    // }
    const code = srv.code ?? srv['@type'] ?? 'Error';
    const message = srv.message ?? srv['@message'] ?? 'Unknown failure';
    const inner = srv.innererror?.['@message'] ?? '';

    if (code === 'RequestExecutionTimeout') {
      return `The query has exceeded the maximum query timeout of ${options.queryTimeout} milliseconds`;
    } else {
      return `${code}: ${message}${inner ? ` – ${inner}` : ''}`;
    }
  }

  // Fallbacks
  if (err?.message) return err.message;
  return String(err);
}

function _getDetailBlockValues(row) {
  let values = [];

  detailFieldsCompiled.forEach((rule) => {
    let value = _.get(row, rule.path, null);
    if (value !== null) {
      values.push({
        label: rule.label,
        value
      });
    }
  });

  return values;
}

function _getSummaryTags(rows, options) {
  let tags = [];
  let uniqueValues = new Set();

  rows.forEach((row) => {
    summaryFieldsCompiled.forEach((rule) => {
      let value = _.get(row, rule.path, null);
      let alreadyExists = uniqueValues.has(normalizeSummaryTagValue(value));

      if (!alreadyExists) {
        if (value !== null) {
          if (rule.label.length > 0) {
            tags.push(`${rule.label}: ${value}`);
          } else {
            tags.push(value);
          }

          uniqueValues.add(normalizeSummaryTagValue(value));
        }
      }
    });
  });

  if (tags.length > options.maxSummaryTags && options.maxSummaryTags > 0) {
    let length = tags.length;
    tags = tags.slice(0, options.maxSummaryTags);
    tags.push(`+${length - options.maxSummaryTags} more`);
  }

  if (tags.length === 0) {
    tags.push(`${rows.length} result${rows.length > 1 ? 's' : ''}`);
  }

  return tags;
}

function normalizeSummaryTagValue(value) {
  if (value !== null && typeof value === 'string') {
    return value.toLowerCase().trim();
  }
  return value;
}

function CompileException(message) {
  this.message = message;
}

function _compileFieldsOption(fields, useDefaultLabels = true) {
  const compiledFields = [];

  fields.split(',').forEach((field) => {
    let tokens = field.split(':');
    let label;
    let fieldPath;

    if (tokens.length !== 1 && tokens.length !== 2) {
      throw new CompileException(
        `Invalid field "${field}".  Field should be of the format "<label>:<json path>" or "<json path>"`
      );
    }

    if (tokens.length === 1) {
      // no label
      fieldPath = tokens[0].trim();
      label = useDefaultLabels ? tokens[0].trim() : '';
    } else if (tokens.length === 2) {
      // label specified
      fieldPath = tokens[1].trim();
      label = tokens[0].trim();
    }

    compiledFields.push({
      label,
      path: fieldPath
    });
  });

  return compiledFields;
}

const isPrivateIp = (entity) => {
  return isLoopBackIp(entity.value) || isLinkLocalAddress(entity.value) || entity.isPrivateIP === true;
};

const isLoopBackIp = (entityValue) => {
  return entityValue.startsWith('127');
};

const isLinkLocalAddress = (entityValue) => {
  return entityValue.startsWith('169');
};

module.exports = {
  startup,
  doLookup
};
