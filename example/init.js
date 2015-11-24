'use strict';

var Glossary = require('../src/glossary').Glossary;
var terms = require('./terms.json');

new Glossary(terms);
