module.exports = {
  name: 'Microsoft Azure Data Explorer',
  acronym: 'ADX',
  description: 'Run Kusto queries against your Azure Data Explorer cluster',
  defaultColor: 'light-gray',
  logging: {
    level: 'info'
  },
  entityTypes: ['IPv4', 'IPv4CIDR', 'IPv6', 'domain', 'url', 'MD5', 'SHA1', 'SHA256', 'email', 'cve', 'MAC', 'string'],
  request: {
    cert: '',
    key: '',
    passphrase: '',
    ca: '',
    proxy: ''
  },
  styles: ['./styles/styles.less'],
  block: {
    component: {
      file: './component/block.js'
    },
    template: {
      file: './templates/block.hbs'
    }
  },
  options: [
    {
      key: 'clusterUrl',
      name: 'Azure Log Analytics API URL',
      description:
        'The Azure Data Explorer Cluster URL.  Should be of the format `https://<your-cluster-name>.<region>.kusto.windows.net`',
      default: 'https://<your-cluster-name>.<region>.kusto.windows.net',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'clientId',
      name: 'Azure AD Registered App Client/Application ID',
      description: "Your Azure AD Registered App's Client ID associated with your Azure Data Explorer Instance.",
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'tenantId',
      name: 'Azure AD Registered App Tenant/Directory ID',
      description: "Your Azure AD Registered App's Tenant ID associated with your Azure Data Explorer Instance.",
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'clientSecret',
      name: 'Azure AD Registered App Client Secret Value',
      description: "Your Azure AD Registered App's Client Secret associated with your Azure Data Explorer Instance.",
      default: '',
      type: 'password',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'dbName',
      name: 'Database Name',
      description: 'The name of the database to connect to and query',
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'query',
      name: 'Search Query',
      description:
        "The search query to execute written in Kusto Query Language (KQL).  The query should use the query parameter `polarity_entity_value` which will be replaced by the entity recognized on the user's screen.  Keep in mind Kusto queries are case-sensitive to include column names, table names, and operator names.",
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'queryTimeout',
      name: 'Search Query Timeout in Milliseconds',
      description:
        'The number of milliseconds before the search query is cancelled due to reaching the specified timeout. Defaults to 10000 milliseconds.',
      default: 10000,
      type: 'number',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'summaryFields',
      name: 'Summary Fields',
      description:
        'Comma-delimited list of field names to include as part of the summary tags. JSON dot notation can be used to target nested fields. Fields must be returned by your search query to be displayed. You can change the label for your fields by prepending the label to the field path and separating it with a colon (i.e., "<label>:<json path>"). If left blank, a result count will be shown. This option should be set to "Lock and hide option for all users".',
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'maxSummaryTags',
      name: 'Maximum Number of Summary Tags',
      description:
        'The maximum number of summary tags to display in the Overlay Window before showing a count.  If set to 0, all tags will be shown.',
      default: 5,
      type: 'number',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'detailFields',
      name: 'Details Fields',
      description:
        'Comma-delimited list of field names to include as part of the details block. JSON dot notation can be used to target nested fields. Fields must be returned by your search query to be displayed. You can change the label for your fields by prepending the label to the field path and separating it with a colon (i.e., "<label>:<json path>"). If left blank, all fields will be shown in tabular format. This option should be set to "Lock and hide option for all users".',
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'documentTitleField',
      name: 'Document Title Field',
      description:
        'Field to use as the title for each returned document in the details template. This field must be returned by your search query.  Defaults to displaying a Row Number for the returned result.',
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'searchPrivateIps',
      name: 'Search Private IPs',
      description: 'If checked, the integration will search private IPs.  Defaults to `true`',
      default: true,
      type: 'boolean',
      userCanEdit: false,
      adminOnly: true
    }
  ]
};
