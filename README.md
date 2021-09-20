# Due to changes in the priorities, this project is currently not being supported. The project is archived as of 9/17/21 and will be available in a read-only state. Please note, since archival, the project is not maintained or reviewed. #

# oas-nodegen-example

An example project that demonstrates generating code from [Open API Specification](https://openapis.org/specification "Link to OAS") (FKA Swagger) using oas-nodegen.  The API implements a basic resource for OAS members.

## Overview

This project uses oas-nodegen to generate code that fits within a simple framework that might resemble something that you use (e.g. Usage of generics, base classes, object relational mapper, etc.).  This API uses:

- [Spring Boot](http://projects.spring.io/spring-boot/ "Spring Boot")
- [Spring Data MongoDB](http://projects.spring.io/spring-data-mongodb/ "Spring Data MongoDB")
- [Jersey](https://jersey.java.net/ "Jersey")

![Example overview](https://raw.githubusercontent.com/capitalone/oas-nodegen-example/master/oas-members-api.png)

## Running

To try this example, use the commands below to build and run (assumes MongoDB is running and listening on 27017 - authentication disabled):

```bash
$ git clone https://github.com/capitalone/oas-nodegen-example.git
$ cd oas-nodegen-example
$ gradle bootRun
```

You can change the model classes from being simple POJOs to immutable classes that better support OAS JSON schema composition (e.g. $allOf) by changing the following line in codegen.js from:

```js
var mode = 'pojo';
```

To:

```js
var mode = 'immutable';
```

## Contributors

We welcome your interest in Capital One’s Open Source Projects (the “Project”). Any Contributor to the project must accept and sign a CLA indicating agreement to the license terms. Except for the license granted in this CLA to Capital One and to recipients of software distributed by Capital One, you reserve all right, title, and interest in and to your contributions; this CLA does not impact your rights to use your own contributions for any other purpose.

[Link to CLA](https://docs.google.com/forms/d/19LpBBjykHPox18vrZvBbZUcK6gQTj7qv1O5hCduAZFU/viewform "Capital One Individual and Corporate Contributor License Agreement")

This project adheres to the [Open Source Code of Conduct](http://www.capitalone.io/codeofconduct/ "Code of Conduct"). By participating, you are expected to honor this code.
