// @flow
// Copyright (C) 2015-2018 MetaBrainz Foundation
//
// This file is part of MusicBrainz, the open internet music database,
// and is licensed under the GPL version 2, or (at your option) any
// later version: http://www.gnu.org/licenses/gpl-2.0.txt

const $ = require('jquery');
const _ = require('lodash');
const ko = require('knockout');
const React = require('react');
const ReactDOM = require('react-dom');
const {createStore} = require('redux');

const {
  createField,
  FormRowSelectList,
  subfieldErrors,
} = require('../../components/forms');
const {l} = require('./common/i18n');
const {lp_attributes} = require('./common/i18n/attributes');
const MB = require('./common/MB');
const scriptArgs = require('./common/utility/getScriptArgs')();
const {Lens, prop, index, set, compose2, compose3} = require('./common/utility/lens');

type LanguageField = FieldT<number>;

type LanguageFields = $ReadOnlyArray<LanguageField>;

type WorkAttributeField = CompoundFieldT<{|
  +type_id: FieldT<number | null>,
  +value: FieldT<number | string | null>,
|}>;

type WorkForm = FormT<{|
  +attributes: RepeatableFieldT<WorkAttributeField>,
  +languages: RepeatableFieldT<LanguageField>,
|}>;

// Flow does not support assigning types within destructuring assignments:
// https://github.com/facebook/flow/issues/235
const form: WorkForm = scriptArgs.form;
const workAttributeTypeTree: WorkAttributeTypeTreeRootT = scriptArgs.workAttributeTypeTree;
const workAttributeValueTree: WorkAttributeTypeAllowedValueTreeRootT = scriptArgs.workAttributeValueTree;
const workLanguageOptions: GroupedOptionsT = scriptArgs.workLanguageOptions;

const languagesField: Lens<WorkForm, LanguageFields> =
  compose3(prop('field'), prop('languages'), prop('field'));

const store = createStore(function (state: WorkForm = form, action) {
  switch (action.type) {
    case 'ADD_LANGUAGE':
      state = addLanguageToState(state);
      break;

    case 'EDIT_LANGUAGE':
      state = set(
        (compose3(
          languagesField,
          (index(action.index): Lens<LanguageFields, LanguageField>),
          (prop('value'): Lens<LanguageField, number>)
        ): Lens<WorkForm, number>),
        action.languageId,
        state,
      );
      break;

    case 'REMOVE_LANGUAGE':
      state = removeLanguageFromState(state, action.index);
      break;
  }

  if (!state.field.languages.field.length) {
    state = addLanguageToState(state);
  }

  return state;
});

function addLanguageToState(form: WorkForm): WorkForm {
  const languages = form.field.languages.field.slice(0);
  const newForm = set(languagesField, languages, form);
  languages.push(createField(newForm, null));
  return newForm;
}

function removeLanguageFromState(form: WorkForm, i: number): WorkForm {
  const languages = form.field.languages.field.slice(0);
  languages.splice(i, 1);
  return set(languagesField, languages, form);
}

class WorkAttribute {
  allowedValues: () => OptionListT;
  allowedValuesByTypeID: {[number]: OptionListT};
  attributeValue: (?string) => string;
  errors: (?$ReadOnlyArray<string>) => $ReadOnlyArray<string>;
  parent: ViewModel;
  typeHasFocus: (?boolean) => boolean;
  typeID: (?number) => number;

  constructor(
    data: WorkAttributeField,
    parent: ViewModel,
  ) {
    this.attributeValue = ko.observable(data.field.value.value);
    this.errors = ko.observableArray(subfieldErrors(data));
    this.parent = parent;
    this.typeHasFocus = ko.observable(false);
    this.typeID = ko.observable(data.field.type_id.value);

    this.allowedValues = ko.computed(() => {
      let typeID = this.typeID();

      if (this.allowsFreeText()) {
        return [];
      } else {
        return this.parent.allowedValuesByTypeID[typeID];
      }
    });

    this.typeID.subscribe(newTypeID => {
      // != is used intentionally for type coercion.
      if (this.typeID() != newTypeID) {
        this.attributeValue("");
        this.resetErrors();
      }
    });

    this.attributeValue.subscribe(() => this.resetErrors());
  }

  allowsFreeText() {
    return !this.typeID() || this.parent.attributeTypesByID[this.typeID()].freeText;
  }

  isGroupingType() {
    return !this.allowsFreeText() && this.allowedValues().length == 0;
  }

  remove() {
    this.parent.attributes.remove(this);
  }

  resetErrors() {
    this.errors([]);
  }
}

class ViewModel {
  attributeTypes: OptionListT;
  attributeTypesByID: {[number]: WorkAttributeTypeTreeT};
  allowedValuesByTypeID: {[number]: OptionListT};
  attributes: (?$ReadOnlyArray<WorkAttribute>) => $ReadOnlyArray<WorkAttribute>;

  constructor(
    attributeTypes: WorkAttributeTypeTreeRootT,
    allowedValues: WorkAttributeTypeAllowedValueTreeRootT,
    attributes: $ReadOnlyArray<WorkAttributeField>,
  ) {
    this.attributeTypes = MB.forms.buildOptionsTree(
      attributeTypes,
      x => lp_attributes(x.name, 'work_attribute_type'),
      'id',
    );

    this.attributeTypesByID = _.transform(attributeTypes.children, byID, {});

    this.allowedValuesByTypeID = _(allowedValues.children)
      .groupBy(x => x.workAttributeTypeID)
      .mapValues(function (children) {
        return MB.forms.buildOptionsTree(
          {children},
          x => lp_attributes(x.value, 'work_attribute_type_allowed_value'),
          'id',
        );
      })
      .value();

    if (_.isEmpty(attributes)) {
      attributes = [createField(form, {
        type_id: null,
        value: null,
      })];
    }

    this.attributes = ko.observableArray(_.map(attributes, data => new WorkAttribute(data, this)));
  }

  newAttribute() {
    let attr = new WorkAttribute(createField(form, {
      type_id: null,
      value: null,
    }), this);
    attr.typeHasFocus(true);
    this.attributes.push(attr);
  }
}

function byID(result, parent) {
  result[parent.id] = parent;
  _.transform(parent.children, byID, result);
}

ko.applyBindings(
  new ViewModel(
    workAttributeTypeTree,
    workAttributeValueTree,
    form.field.attributes.field,
  ),
  $('#work-attributes')[0]
);

MB.Control.initialize_guess_case('work', 'id-edit-work');

const workLanguagesNode = document.getElementById('work-languages-editor');

function addLanguage() {
  store.dispatch({type: 'ADD_LANGUAGE'});
}

function editLanguage(i, languageId) {
  store.dispatch({
    type: 'EDIT_LANGUAGE',
    index: i,
    languageId: languageId,
  });
}

function removeLanguage(i) {
  store.dispatch({
    type: 'REMOVE_LANGUAGE',
    index: i,
  });
}

function renderWorkLanguages() {
  const form: WorkForm = store.getState();
  ReactDOM.render(
    <FormRowSelectList
      addId="add-language"
      addLabel={l('Add Language')}
      fieldName={null}
      label={l('Lyrics Languages')}
      name={form.name + '.languages'}
      onAdd={addLanguage}
      onEdit={editLanguage}
      onRemove={removeLanguage}
      options={workLanguageOptions}
      removeClassName="remove-language"
      removeLabel={l('Remove Language')}
      repeatable={form.field.languages}
    />,
    ((workLanguagesNode: any): Element),
  );
}

store.subscribe(renderWorkLanguages);
renderWorkLanguages();

MB.Control.initializeBubble('#iswcs-bubble', 'input[name=edit-work\\.iswcs\\.0]');

let typeIdField = 'select[name=edit-work\\.type_id]';
MB.Control.initializeBubble('#type-bubble', typeIdField);
$(typeIdField).on('change', function() {
  if (!this.value.match(/\S/g)) {
    $('.type-bubble-description').hide();
    $('#type-bubble-default').show();
  } else {
    $('#type-bubble-default').hide();
    $('.type-bubble-description').hide();
    $(`#type-bubble-description-${this.value}`).show();
  }
});
