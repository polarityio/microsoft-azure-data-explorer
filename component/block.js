'use strict';

polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  rows: Ember.computed.alias('details.rows'),
  // Session Paging Variables
  currentPage: 1,
  pageSize: 5,
  pagingData: Ember.computed.alias('rows'),
  isPrevButtonsDisabled: Ember.computed('currentPage', function () {
    return this.get('currentPage') === 1;
  }),
  isNextButtonDisabled: Ember.computed('pagingData.length', 'pageSize', 'currentPage', function () {
    const totalResults = this.get('pagingData.length');
    const totalPages = Math.ceil(totalResults / this.get('pageSize'));
    return this.get('currentPage') === totalPages;
  }),
  pagingStartItem: Ember.computed('currentPage', 'pageSize', function () {
    return (this.get('currentPage') - 1) * this.get('pageSize') + 1;
  }),
  pagingEndItem: Ember.computed('pagingStartItem', function () {
    return this.get('pagingStartItem') - 1 + this.get('pageSize');
  }),
  filteredPagingData: Ember.computed('pagingData.length', 'pageSize', 'currentPage', function () {
    if (!this.get('pagingData')) {
      return [];
    }
    const startIndex = (this.get('currentPage') - 1) * this.get('pageSize');
    const endIndex = startIndex + this.get('pageSize');

    return this.get('pagingData').slice(startIndex, endIndex);
  }),
  // End of Paging Variables
  actions: {
    // Start Paging Actions
    prevPage() {
      let currentPage = this.get('currentPage');

      if (currentPage > 1) {
        this.set('currentPage', currentPage - 1);
      }
    },
    nextPage() {
      const totalResults = this.get('pagingData.length');
      const totalPages = Math.ceil(totalResults / this.get('pageSize'));
      let currentPage = this.get('currentPage');
      if (currentPage < totalPages) {
        this.set('currentPage', currentPage + 1);
      }
    },
    firstPage() {
      this.set('currentPage', 1);
    },
    lastPage() {
      const totalResults = this.get('pagingData.length');
      const totalPages = Math.ceil(totalResults / this.get('pageSize'));
      this.set('currentPage', totalPages);
    },
    // End Paging Actions
    showTable: function (index) {
      this.set(`rows.${index}.showTable`, true);
      this.set(`rows.${index}.showJson`, false);
    },
    showJson: function (index) {
      if (typeof this.get(`rows.${index}.json`) === 'undefined') {
        this.set(`rows.${index}.json`, this.syntaxHighlight(JSON.stringify(this.get(`rows.${index}.data`), null, 2)));
      }
      this.set(`rows.${index}.showTable`, false);
      this.set(`rows.${index}.showJson`, true);
    },
    toggleTabs: function (index) {
      this.toggleProperty(`rows.${index}.showTabs`);
    }
  },
  syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'key';
          } else {
            cls = 'string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'boolean';
        } else if (/null/.test(match)) {
          cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
      }
    );
  }
});
