'use strict';

/* global require, module, document */

var $ = require('jquery');
var _ = require('underscore');
var List = require('list.js');
var accordion = require('accordion/src/accordion');

var KEYCODE_ESC = 27;

var ITEM_TEMPLATE =
  '<li id="glossary-list-item" class="glossary__item">' +
    '<div class="js-accordion_header accordion__header">' +
      '<h4 class="glossary-term"></h4>' +
      '<button class="button button--secondary accordion__button js-accordion_button">' +
        '<span class="js-accordion_text u-visually-hidden" data-show="Show definition" data-hide="Hide definition"></span>' +
      '</button>' +
    '</div>' +
    '<p class="glossary-definition js-accordion_item"></p>' +
  '</li>';

var defaultSelectors = {
  body: '#glossary',
  toggle: '.js-glossary-toggle',
  term: '.term'
};

function removeTabindex($elm) {
  $elm
    .find('a, button, :input, [tabindex]')
    .attr('tabindex', '-1');
}

function restoreTabindex($elm) {
  $elm
    .find('a, button, :input, [tabindex]')
    .attr('tabindex', '0');
}

/**
 * Glossary widget
 * @constructor
 * @param {Array} terms - Term objects with "glossary-term" and "glossary-definition" keys
 * @param {Object} selectors - CSS selectors for glossary components
 */
function Glossary(terms, selectors) {
  var self = this;

  self.terms = terms;
  self.selectors = _.extend({}, defaultSelectors, selectors);

  self.$body = $(self.selectors.body);
  self.$toggle = $(self.selectors.toggle);
  self.$search = this.$body.find('.glossary__search');

  // Initialize state
  self.isOpen = false;

  // Update DOM
  self.populate();
  self.linkTerms();

  // Remove tabindices
  removeTabindex(self.$body);

  // Initialize accordions
  self.$body.find('.js-accordion').each(function(idx, elm) {
    Object.create(accordion).init($(elm));
  });

  // Bind listeners
  self.$toggle.on('click', this.toggle.bind(this));
  self.$body.on('click', '.toggle', this.toggle.bind(this));
  self.$search.on('input', this.handleInput.bind(this));
  $(document.body).on('keyup', this.handleKeyup.bind(this));
}

/** Populate internal list.js list of terms */
Glossary.prototype.populate = function() {
  var options = {
    item: ITEM_TEMPLATE,
    valueNames: ['glossary-term'],
    listClass: 'glossary__list',
    searchClass: 'glossary__search'
  };
  this.list = new List('glossary', options, this.terms);
  this.list.sort('glossary-term', {order: 'asc'});
};

/** Add links to terms in body */
Glossary.prototype.linkTerms = function() {
  var self = this;
  var $terms = $(self.selectors.term);
  $terms.each(function(){
    var $term = $(this);
    $term.attr('title', 'Click to define')
      .attr('tabindex', 0)
      .data('term', $term.data('term').toLowerCase());
  });
  $terms.on('click keypress', function(e) {
    if (e.which === 13 || e.type === 'click') {
      self.show();
      self.findTerm($(this).data('term'));
    }
  });
};

/** Highlight a term */
Glossary.prototype.findTerm = function(term) {
  this.$search.val(term);

  // Highlight the term and remove other highlights
  this.$body.find('.term--highlight').removeClass('term--highlight');
  this.$body.find('span[data-term="' + term + '"]').addClass('term--highlight');
  this.list.filter(function(item) {
    return item._values['glossary-term'].toLowerCase() === term;
  });

  // Hack: Expand text for selected item
  this.list.search();
  _.each(this.list.visibleItems, function(item) {
    var $elm = $(item.elm).find('div');
    if ($elm.hasClass('accordion--collapsed')) {
      $elm.find('.accordion__button').click();
    }
  });
};

Glossary.prototype.toggle = function() {
  var method = this.isOpen ? this.hide : this.show;
  method.apply(this);
};

Glossary.prototype.show = function() {
  this.$body.addClass('is-open').attr('aria-hidden', 'false');
  this.$toggle.addClass('active');
  this.$search.focus();
  this.isOpen = true;
  restoreTabindex(this.$body);
};

Glossary.prototype.hide = function() {
  this.$body.removeClass('is-open').attr('aria-hidden', 'true');
  this.$toggle.removeClass('active');
  this.$toggle.focus();
  this.isOpen = false;
  removeTabindex(this.$body);
};

/** Remove existing filters on input */
Glossary.prototype.handleInput = function(e) {
  if (this.list.filtered) {
    this.list.filter();
  }
};

/** Close glossary on escape keypress */
Glossary.prototype.handleKeyup = function(e) {
  if (e.keyCode == KEYCODE_ESC) {
    if (this.isOpen) {
      this.hide();
    }
  }
};

module.exports = {Glossary: Glossary};
