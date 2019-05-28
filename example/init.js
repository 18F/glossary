"use strict";

var Glossary = require("../src/glossary");
var terms = require("./terms.json");
var classes = {
  definitionClass: "usa-accordion__content",
  termClass: "usa-accordion__heading usa-accordion__button"
};

new Glossary(terms, {}, classes);
