/**
 * Custom error used when a Kusto (or any data-layer) query fails.
 * Includes the original query text and the entity value
 */
class QueryExecutionError extends Error {
  /**
   * @param {string} message      – human-readable description
   * @param {string} query        – the Kusto/SQL/etc. query that failed
   * @param {string} entityValue  – value of the parameter/entity involved
   */
  constructor(message, query, entityValue) {
    super(message);
    this.name = 'QueryExecutionError';

    /** @type {string} */
    this.query = query;

    /** @type {string} */
    this.entityValue = entityValue;

    // Maintain proper stack trace (only in V8 environments like Node)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, QueryExecutionError);
    }
  }

  /**
   * Allow JSON.stringify(err) to include custom fields.
   * @returns {{name: string, message: string, query: string, entityValue: string, stack?: string}}
   */
  toJSON() {
    const { name, message, query, entityValue, stack } = this;
    return { name, message, query, entityValue, stack };
  }
}

module.exports = { QueryExecutionError };
