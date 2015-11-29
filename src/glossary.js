'use strict';

var _ = require('underscore');
var List = require('list.js');
var Accordion = require('accordion');

var KEYCODE_ENTER = 13;
var KEYCODE_ESC = 27;

// https://davidwalsh.name/element-matches-selector
function selectorMatches(el, selector) {
  var p = Element.prototype;
  var f = p.matches || p.webkitMatchesSelector || p.mozMatchesSelector || p.msMatchesSelector || function(s) {
    return [].indexOf.call(document.querySelectorAll(s), this) !== -1;
  };
  return f.call(el, selector);
}

function forEach(values, callback) {
  return [].forEach.call(values, callback);
}

var ITEM_TEMPLATE =
  '<li id="glossary-list-item" class="glossary__item">' +
    '<button class="accordion__header glossary-term">' +
    '</button>' +
    '<p class="glossary-definition"></p>' +
  '</li>';

var defaultSelectors = {
  body: '#glossary',
  toggle: '.js-glossary-toggle',
  close: '.js-glossary-close',
  term: '.term'
};

function removeTabindex(elm) {
  var elms = getTabIndex(elm);
  forEach(elms, function(elm) {
    elm.setAttribute('tabIndex', '-1');
  });
}

function restoreTabindex(elm) {
  var elms = getTabIndex(elm);
  forEach(elms, function(elm) {
    elm.setAttribute('tabIndex', '0');
  });
}

function getTabIndex(elm) {
  return elm.querySelectorAll('a, button, input, [tabindex]');
}

/**
 * Glossary widget
 * @constructor
 * @param {Array} terms - Term objects with "glossary-term" and "glossary-definition" keys
 * @param {Object} selectors - CSS selectors for glossary components
 */
function Glossary(terms, selectors) {
  this.terms = terms;
  this.selectors = _.extend({}, defaultSelectors, selectors);

  this.body = document.querySelector(this.selectors.body);
  this.toggleBtn = document.querySelector(this.selectors.toggle);
  this.closeBtn = document.querySelector(this.selectors.close);
  this.search = this.body.querySelector('.glossary__search');

  // Initialize state
  this.isOpen = false;

  // Update DOM
  this.populate();
  this.linkTerms();

  // Remove tabindices
  removeTabindex(this.body);

  // Initialize accordions
  this.accordion = new Accordion();

  // Bind listeners
  this.listeners = [];
  this.addEventListener(this.toggleBtn, 'click', this.toggle.bind(this));
  this.addEventListener(this.closeBtn, 'click', this.hide.bind(this));
  this.addEventListener(this.body, 'click', '.toggle', this.toggle.bind(this));
  this.addEventListener(this.search, 'input', this.handleInput.bind(this));
  this.addEventListener(document.body, 'keyup', this.handleKeyup.bind(this));
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
  var terms = document.querySelectorAll(this.selectors.term);
  forEach(terms, function(term) {
    term.setAttribute('title', 'Click to define');
    term.setAttribute('tabIndex', 0);
    term.setAttribute('data-term', (term.getAttribute('data-term') || '').toLowerCase());
  });
  document.body.addEventListener('click', this.handleTermTouch.bind(this));
  document.body.addEventListener('keyup', this.handleTermTouch.bind(this));
};

Glossary.prototype.handleTermTouch = function(e) {
  if (e.which === KEYCODE_ENTER || e.type === 'click') {
    if (selectorMatches(e.target, this.selectors.term)) {
      this.show();
      this.findTerm(e.target.getAttribute('data-term'));
    }
  }
};

/** Highlight a term */
Glossary.prototype.findTerm = function(term) {
  this.search.value = term;

  // Highlight the term and remove other highlights
  forEach(this.body.querySelectorAll('.term--highlight'), function(term) {
    term.classList.remove('term--highlight');
  });
  forEach(this.body.querySelectorAll('span[data-term="' + term + '"]'), function(term) {
    term.classList.add('term--highlight');
  });
  this.list.filter(function(item) {
    return item._values['glossary-term'].toLowerCase() === term;
  });

  // Hack: Expand text for selected item
  this.list.search();
  this.list.visibleItems.forEach(function(item) {
    var elm = item.elm.querySelector('div');
    if (elm && elm.classList.contains('accordion--collapsed')) {
      elm.querySelector('.accordion__button').click();
    }
  });
};

Glossary.prototype.toggle = function() {
  var method = this.isOpen ? this.hide : this.show;
  method.apply(this);
};

Glossary.prototype.show = function() {
  this.body.classList.add('is-open');
  this.body.setAttribute('aria-hidden', 'false');
  this.toggleBtn.classList.add('active');
  this.search.focus();
  this.isOpen = true;
  restoreTabindex(this.body);
};

Glossary.prototype.hide = function() {
  this.body.classList.remove('is-open');
  this.body.setAttribute('aria-hidden', 'true');
  this.toggleBtn.classList.remove('active');
  this.toggleBtn.focus();
  this.isOpen = false;
  removeTabindex(this.body);
};

/** Remove existing filters on input */
Glossary.prototype.handleInput = function() {
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

Glossary.prototype.addEventListener = function(elm, event, callback) {
  if (elm) {
    elm.addEventListener(event, callback);
    this.listeners.push({
      elm: elm,
      event: event,
      callback: callback
    });
  }
};

Glossary.prototype.destroy = function() {
  this.accordion.destroy();
  this.listeners.forEach(function(listener) {
    listener.elm.removeEventListener(listener.event, listener.callback);
  });
};

module.exports = Glossary;
