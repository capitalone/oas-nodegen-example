/*
 * Copyright 2016 Capital One Services, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License. 
 */

var path = require('path');
var _ = require('lodash');
var inflection = require('inflection');

var nodegen = require("oas-nodegen");
var utils = nodegen.utils;

var loader = nodegen.createLoader();
var modules = nodegen.createModules();

var baseDir = __dirname;
var swaggerLocation = path.resolve(baseDir, 'oai-members.yaml');
var targetDir = 'build/generated-src/main/java';

var config = {
  packages : {
    model : 'org.openapis.example.nodegen',
    resource : 'org.openapis.example.nodegen'
  }
}

var writer = nodegen.createWriter(baseDir, targetDir);

var templateProcessor = nodegen.createTemplates()
  .setDefaultOptions({ noEscape : true })
  .registerTemplateDirectory(path.resolve(__dirname, 'templates'));

// Switch model types between POJOs or Immutable 
//
var mode = 'pojo';
//var mode = 'immutable';

// Flag to enable code generation customizations
//
var ENABLED = true;

///////////////////////////////////////////////////////////
// RESOURCE GENERATOR
///////////////////////////////////////////////////////////

var resourceGenerator = nodegen.createGenerator()
  .configure({
    modelPackage : config.packages.model,
    resourcePackage : config.packages.resource,
    servicePackage : config.packages.service
  })
  .use(modules.get('JaxRS'));

var resourceTemplate = templateProcessor.compileFromFile('java/' + mode + '/Resource.handlebars');

if (ENABLED) {
//Ignore these operations that are defined in AbstractResource.java
//
resourceGenerator.addIgnoredOperations('create', 'createMany', 'findAll', 'load', 'update', 'delete');

resourceGenerator.onPrepare('Resource', function(context) {
  var resource = context.resource;

  // Tells JaxRS module to pull resource name into top-level @Path annotation
  // and strip from method level @Path annotations
  //
  resource.uriName = inflection.pluralize(inflection.camelize(resource.name, true));
});

resourceGenerator.onDecorate('Resource', function(context) {
  var resource = context.resource;
  
  // Tell the resource to inherit from AbstractResource
  //
  if (mode == 'pojo') {
    resource.parent = 'AbstractResource<' + resource.name + '>';
  } else if (mode == 'immutable') {
    resource.parent = 'AbstractResource<' + resource.name + ', ' + resource.name + '.Impl, ' + resource.name + 'Update>';
  }
});

resourceGenerator.onDecorate('Operation', function(context) {
  var resource = context.resource;
  var operation = context.operation;

  // Change and list return to use the PaginatedList generic type
  //
  if (operation.returnType.endsWith('List')) {
    this.addImport('org.openapis.example.common.PaginatedList', resource);
    operation.returnType = 'PaginatedList<' + operation.returnType.slice(0, -4) + '>';
    operation.isPaginatedList = true;

    resource.imports = _.filter(resource.imports, function(name) {
    var dot = name.lastIndexOf('.');
    if (dot != -1) {
      name = name.substring(dot + 1);
    }
    return !_.contains(['Entity', 'BusinessEntity', 'OneToOne', 'Auditable'], name) && 
      (name == 'PaginatedList' || !name.endsWith('List'));
    });
  }
});
} // ENABLED

resourceGenerator.onWrite('Resource', function(resource, name) {
  var source = resourceTemplate(resource);
  writer.write(this.config.resourcePackage.split('.'), name + 'Resource.java', source);
});

///////////////////////////////////////////////////////////
// MODEL GENERATOR
///////////////////////////////////////////////////////////

var modelGenerator = nodegen.createGenerator()
  .configure({
    modelPackage : config.packages.model
  })
  .use(modules.get('Java8'));

var modelTemplate = templateProcessor.compileFromFile('java/' + mode + '/Model.handlebars');

if (ENABLED) {
modelGenerator.onDecorate('Model', function(context) {
  var model = context.model;

  // Determine the entity name
  //
  model.entityName = inflection.camelize(model.name, true);

  if (model.entityName.endsWith('Update')) {
    model.entityName = model.entityName.slice(0, -6);
  } else if (model.entityName.endsWith('List')) {
    model.entityName = model.entityName.slice(0, -4);
  }

  // Generate a collection name using the plural form of the entity name
  //
  if (model.entityName) {
    model.collectionName = inflection.pluralize(model.entityName);
  }

  // Mark specific models as abstract
  //
  if (_.contains(['PaginatedList', 'Entity', 'Auditable'], model.name)) {
    model['x-abstract'] = true;
  }

  // Detect if the model is an entity or auditable
  //
  model.isEntity =
    _.find(model.references, function(i) { return i.name == 'Entity' }) != null;
  model.isAuditable = 
    _.find(model.references, function(i) { return i.name == 'Auditable' }) != null;

  // Spring Data - Set MongoDB document name and type alias
  //
  if (model.isEntity) {
    this.addImport('org.springframework.data.mongodb.core.mapping.Document', model);
    this.addAnnotation('@Document(collection = ' + this.escapeJavaString(model.collectionName) + ')', model);
    
    this.addImport('org.springframework.data.annotation.TypeAlias', model);
    this.addAnnotation('@TypeAlias(' + this.escapeJavaString(model.entityName) + ')', model);
  }

  // Find and set the correct parent
  // The default is to select the first 'allOf' which will not work in our case
  //
  var parent = _.find(model.references, function(ref) {
    return !_.contains(['Entity', 'Auditable'], ref.name);
  });
  model.parent = parent != null ? parent.name : null;

  // Build list of models to extend
  //
  model.extends = _(model.references)
    .map(function(item) { return item.name; })
    .join(', ');
});

modelGenerator.onFinalize('Model', function(context) {
  var model = context.model;

  // Due to single-inheritance, we have to bring the properties of Entity and Auditable into
  // the collection model
  //
  if (mode == 'pojo') {
    if (model.isAuditable) {
      var auditable = _.find(model.references, function(i) { return i.name == 'Auditable' });
      model.vars.unshift.apply(model.vars, auditable.vars);
      this.addImport('java.time.LocalDateTime', model);
    }
    
    if (model.isEntity) {
      var entity = _.find(model.references, function(i) { return i.name == 'Entity' });
      model.vars.unshift.apply(model.vars, entity.vars);
      this.addImport('org.springframework.data.annotation.Id', model);
    }
  }

  // Build list of interfaces to implement
  //
  model.implements = _(model.references)
    .filter(function(item) { return item['x-abstract']; })
    .map(function(item) { return item.name; })
    .join(', ');

  // Tell Jackson to serialize the properties in the correct order
  //
  if (mode == 'pojo' && !model['x-abstract']) {
    this.addImport('com.fasterxml.jackson.annotation.JsonPropertyOrder', model);
    this.addAnnotation('@JsonPropertyOrder({ ' + this.joinStrings(_.map(model.allVars, function(v) { return v.name; })) + ' })', model);
  }
});

modelGenerator.onDecorate('Property', function(context) {
  var model = context.model;
  var property = context.property;

  // Apply Spring data annotations for mapping to MongoDB
  //
  if (property.name == 'id') {
    this.addImport('org.springframework.data.annotation.Id', property);
    //this.addImport('org.springframework.data.annotation.Id', model);
    this.addAnnotation('@Id', property);
  } else if (property['x-stored-as']) {
    this.addImport('org.springframework.data.mongodb.core.mapping.Field', property);
    this.addImport('org.springframework.data.mongodb.core.mapping.Field', model);
    this.addAnnotation('@Field(' + this.escapeJavaString(property['x-stored-as']) + ')', property);
  }

  // Add index annotations
  //
  var indexed = property['x-indexed'];

  if (indexed) {
    this.addImport('org.springframework.data.mongodb.core.index.Indexed', property);
    this.addImport('org.springframework.data.mongodb.core.index.Indexed', model);
    this.addAnnotation('@Indexed(name = '
        + this.escapeJavaString(indexed.name)
        + (indexed.unique ? ', unique = true' : '') + ')', property);
  }
});
} // ENABLED

modelGenerator.onWrite('Model', function(model, name) {
  // Only write out entities and updates
  //
  if (!ENABLED || !name.endsWith('List')) {
    var source = modelTemplate(model);
    writer.write(this.config.modelPackage.split('.'), name + '.java', source);
  }
});

////

var abstractResourceTemplate = templateProcessor.compileFromFile('java/' + mode + '/AbstractResource.handlebars');
var memberRepositoryTemplate = templateProcessor.compileFromFile('java/MemberRepository.handlebars');

///////////////////////////////////////////////////////////

loader.load(swaggerLocation).then(function(swagger) {
  try {
    writer.clean();
    
    // Write some static files
    //
    writer.write(config.packages.resource.split('.'),
        'AbstractResource.java', abstractResourceTemplate({}));
    writer.write(config.packages.resource.split('.'),
        'MemberRepository.java', memberRepositoryTemplate({
          type: (mode == 'pojo' ? '' : '.Impl')
        }));

    modelGenerator.process(swagger);
    resourceGenerator.process(swagger);
  } catch (error) {
    console.log("Processing failure", error.stack);
    process.exit(1);
  }
}).fail(function(error) {
  console.log("Loading failure", error.stack);
  process.exit(1);
});
