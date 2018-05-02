(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("lodash"));
	else if(typeof define === 'function' && define.amd)
		define(["lodash"], factory);
	else if(typeof exports === 'object')
		exports["LinusDialog"] = factory(require("lodash"));
	else
		root["linus"] = root["linus"] || {}, root["linus"]["LinusDialog"] = factory(root["_"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_lodash__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/LinusDialog.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/indexof/index.js":
/*!***************************************!*\
  !*** ./node_modules/indexof/index.js ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("\nvar indexOf = [].indexOf;\n\nmodule.exports = function(arr, obj){\n  if (indexOf) return arr.indexOf(obj);\n  for (var i = 0; i < arr.length; ++i) {\n    if (arr[i] === obj) return i;\n  }\n  return -1;\n};\n\n//# sourceURL=webpack://linus.%5Bname%5D/./node_modules/indexof/index.js?");

/***/ }),

/***/ "./node_modules/vm-browserify/index.js":
/*!*********************************************!*\
  !*** ./node_modules/vm-browserify/index.js ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("var indexOf = __webpack_require__(/*! indexof */ \"./node_modules/indexof/index.js\");\n\nvar Object_keys = function (obj) {\n    if (Object.keys) return Object.keys(obj)\n    else {\n        var res = [];\n        for (var key in obj) res.push(key)\n        return res;\n    }\n};\n\nvar forEach = function (xs, fn) {\n    if (xs.forEach) return xs.forEach(fn)\n    else for (var i = 0; i < xs.length; i++) {\n        fn(xs[i], i, xs);\n    }\n};\n\nvar defineProp = (function() {\n    try {\n        Object.defineProperty({}, '_', {});\n        return function(obj, name, value) {\n            Object.defineProperty(obj, name, {\n                writable: true,\n                enumerable: false,\n                configurable: true,\n                value: value\n            })\n        };\n    } catch(e) {\n        return function(obj, name, value) {\n            obj[name] = value;\n        };\n    }\n}());\n\nvar globals = ['Array', 'Boolean', 'Date', 'Error', 'EvalError', 'Function',\n'Infinity', 'JSON', 'Math', 'NaN', 'Number', 'Object', 'RangeError',\n'ReferenceError', 'RegExp', 'String', 'SyntaxError', 'TypeError', 'URIError',\n'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'escape',\n'eval', 'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'undefined', 'unescape'];\n\nfunction Context() {}\nContext.prototype = {};\n\nvar Script = exports.Script = function NodeScript (code) {\n    if (!(this instanceof Script)) return new Script(code);\n    this.code = code;\n};\n\nScript.prototype.runInContext = function (context) {\n    if (!(context instanceof Context)) {\n        throw new TypeError(\"needs a 'context' argument.\");\n    }\n    \n    var iframe = document.createElement('iframe');\n    if (!iframe.style) iframe.style = {};\n    iframe.style.display = 'none';\n    \n    document.body.appendChild(iframe);\n    \n    var win = iframe.contentWindow;\n    var wEval = win.eval, wExecScript = win.execScript;\n\n    if (!wEval && wExecScript) {\n        // win.eval() magically appears when this is called in IE:\n        wExecScript.call(win, 'null');\n        wEval = win.eval;\n    }\n    \n    forEach(Object_keys(context), function (key) {\n        win[key] = context[key];\n    });\n    forEach(globals, function (key) {\n        if (context[key]) {\n            win[key] = context[key];\n        }\n    });\n    \n    var winKeys = Object_keys(win);\n\n    var res = wEval.call(win, this.code);\n    \n    forEach(Object_keys(win), function (key) {\n        // Avoid copying circular objects like `top` and `window` by only\n        // updating existing context properties or new properties in the `win`\n        // that was only introduced after the eval.\n        if (key in context || indexOf(winKeys, key) === -1) {\n            context[key] = win[key];\n        }\n    });\n\n    forEach(globals, function (key) {\n        if (!(key in context)) {\n            defineProp(context, key, win[key]);\n        }\n    });\n    \n    document.body.removeChild(iframe);\n    \n    return res;\n};\n\nScript.prototype.runInThisContext = function () {\n    return eval(this.code); // maybe...\n};\n\nScript.prototype.runInNewContext = function (context) {\n    var ctx = Script.createContext(context);\n    var res = this.runInContext(ctx);\n\n    forEach(Object_keys(ctx), function (key) {\n        context[key] = ctx[key];\n    });\n\n    return res;\n};\n\nforEach(Object_keys(Script.prototype), function (name) {\n    exports[name] = Script[name] = function (code) {\n        var s = Script(code);\n        return s[name].apply(s, [].slice.call(arguments, 1));\n    };\n});\n\nexports.createScript = function (code) {\n    return exports.Script(code);\n};\n\nexports.createContext = Script.createContext = function (context) {\n    var copy = new Context();\n    if(typeof context === 'object') {\n        forEach(Object_keys(context), function (key) {\n            copy[key] = context[key];\n        });\n    }\n    return copy;\n};\n\n\n//# sourceURL=webpack://linus.%5Bname%5D/./node_modules/vm-browserify/index.js?");

/***/ }),

/***/ "./src/LinusDialog.js":
/*!****************************!*\
  !*** ./src/LinusDialog.js ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\n\nvar _LinusDialogBase = __webpack_require__(/*! ./LinusDialogBase */ \"./src/LinusDialogBase.js\");\n\nvar _LinusDialogBase2 = _interopRequireDefault(_LinusDialogBase);\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }\n\nfunction _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError(\"Cannot call a class as a function\"); } }\n\nfunction _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }\n\n// TODO Remover baseFn ????\nvar BASE = Symbol('base');\nvar BASE_FN = Symbol('baseFn');\nvar baseFn = function baseFn(obj) {\n  return function (method) {\n    return function (args) {\n      obj[method].apply(obj, _toConsumableArray(args));\n    };\n  };\n};\n\nvar LinusDialog =\n// TODO: Remover baseFn???? registerTokenizer = this[BASE_FN]('registerTokenizer');\nfunction LinusDialog(initArgs) {\n  var _this = this;\n\n  _classCallCheck(this, LinusDialog);\n\n  this.resolve = function (message, ctx) {\n    return _this[BASE].resolve(message, ctx);\n  };\n\n  this.use = function (handler) {\n    return _this[BASE].use(handler);\n  };\n\n  this.registerTokenizer = function (tokenizer, overwrite) {\n    return _this[BASE].registerTokenizer(tokenizer, overwrite);\n  };\n\n  this[BASE] = new _LinusDialogBase2.default(initArgs);\n  this[BASE_FN] = baseFn(this[BASE]);\n};\n\nexports.default = LinusDialog;\nmodule.exports = exports['default'];\n\n//# sourceURL=webpack://linus.%5Bname%5D/./src/LinusDialog.js?");

/***/ }),

/***/ "./src/LinusDialogBase.js":
/*!********************************!*\
  !*** ./src/LinusDialogBase.js ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\n\nvar _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };\n\nvar _lodash = __webpack_require__(/*! lodash */ \"lodash\");\n\nvar _lodash2 = _interopRequireDefault(_lodash);\n\nvar _requiredParam = __webpack_require__(/*! ./utils/requiredParam */ \"./src/utils/requiredParam.js\");\n\nvar _requiredParam2 = _interopRequireDefault(_requiredParam);\n\nvar _RTInterpreter = __webpack_require__(/*! ./utils/RTInterpreter */ \"./src/utils/RTInterpreter.js\");\n\nvar _RTInterpreter2 = _interopRequireDefault(_RTInterpreter);\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }\n\nfunction _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }\n\nfunction _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }\n\nfunction _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step(\"next\", value); }, function (err) { step(\"throw\", err); }); } } return step(\"next\"); }); }; }\n\nfunction _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError(\"Cannot call a class as a function\"); } }\n\nvar INTERNAL_ATTR = 'env';\n\nvar LinusDialogBase = function LinusDialogBase(_ref) {\n  var _ref$bot = _ref.bot,\n      bot = _ref$bot === undefined ? (0, _requiredParam2.default)('bot') : _ref$bot,\n      _ref$topics = _ref.topics,\n      topics = _ref$topics === undefined ? [] : _ref$topics,\n      _ref$interactions = _ref.interactions,\n      interactions = _ref$interactions === undefined ? [] : _ref$interactions,\n      _ref$handlers = _ref.handlers,\n      handlers = _ref$handlers === undefined ? [] : _ref$handlers,\n      _ref$tokenizers = _ref.tokenizers,\n      tokenizers = _ref$tokenizers === undefined ? [] : _ref$tokenizers,\n      _ref$sandboxScope = _ref.sandboxScope,\n      sandboxScope = _ref$sandboxScope === undefined ? {} : _ref$sandboxScope;\n\n  _classCallCheck(this, LinusDialogBase);\n\n  _initialiseProps.call(this);\n\n  this.interpreter = (0, _RTInterpreter2.default)(sandboxScope);\n  // TODO: Should I care to not mutate passed interactions object ? (ie.:CloneDeep it, maybe immer)\n  this.src = {\n    bot: bot,\n    topics: _lodash2.default.keyBy(topics, 'id'),\n    interactions: _lodash2.default.keyBy(this.interpretInteractionScritps(interactions), function (i) {\n      return i.topicId + ':' + i.id;\n    })\n  };\n\n  handlers.forEach(this.use);\n  this.registerTokenizers(tokenizers);\n}\n\n/**\n * Interpret string conditions for function & calls interpretActions on interaction actions\n * @param interactions\n */\n\n\n/**\n * Interpret string conditions for function & calls interpretSteps on action steps\n * @param actions\n * @return {{condition: *|Object|{type, properties, additionalProperties}, steps: {feedback: *}[]}[]}\n */\n\n\n/**\n * Interpret string feddbacks for function\n * @param {Object<Step>} steps - steps to be transformed\n * @return {{feedback: *}[]}\n */\n\n\n/**\n * Register tokenizer on instance\n * @param {Object} tokenizer - Object as: {id: Tokenizer ID, fn: Tokenizer function (message:String)=>tokens:Object}\n * @param {Boolean} overwrite - Overwrite previous tokenizer registered with same id ?\n */\n\n\n/**\n * Register tokenizers on dialog instance\n * @param {[Object<Tokenizers>]} tokenizers - Tokenizers to register\n */\n\n\n/**\n * Run tokenizers chain in sequence and return message tokens\n * @param {String} message - Message to be tokenized\n * @param {[Object]} tokenizers - Tokenizers objects\n */\n\n\n/**\n * Retrieve single tokenizer from id\n * @param {String} tokenizerId - Tokenizer id\n * @return {Object} Tokenizer w/ id\n */\n\n\n/**\n * Get tokenizers from array of id\n * @param {[String]} tokenizersIds - Tokenizers Ids.\n * @return {*}\n */\n\n\n/**\n * Build tokenizer chain for the topic\n * @param {Object<Topic>} topic - Dialog topic\n * @return {[Object<Tokens>]} tokens - Identified tokens\n */\n\n\n/**\n * Merge tokens into context, keeping internal attributes untouched\n * @param {Object} context - Context object to be enriched\n * @param {Object} tokens - Tokens to enrich context\n * @return {{[p: string]: *}} - Enriched context\n */\n\n\n/**\n * Get topic by id\n * @param {String} topicId - Topic Id\n * @return {Object<Topic>} - Topic\n */\n\n\n/**\n * Use passed handler.\n * @param {Object} handler - Handler to be used\n */\n;\n\nvar _initialiseProps = function _initialiseProps() {\n  var _this = this;\n\n  this.src = {};\n  this.messageTokenizers = {};\n\n  this.interpretInteractionScritps = function () {\n    var interactions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];\n\n    // TODO: Should I care to not mutate passed interactions object ? (ie.:CloneDeep it, maybe immer)\n    interactions.map(function (i) {\n      return _extends({}, i, {\n        condition: _this.interpreter.require(i.condition),\n        actions: _this.interpretActions(i.actions)\n      });\n    });\n  };\n\n  this.interpretActions = function () {\n    var actions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];\n    return actions.map(function (a) {\n      return _extends({}, a, {\n        condition: _this.interpreter.require(a.condition),\n        steps: _this.interpretSteps(a.steps)\n      });\n    });\n  };\n\n  this.interpretSteps = function () {\n    var steps = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];\n    return steps.map(function (s) {\n      return _extends({}, s, {\n        feedback: _lodash2.default.isString(s.feedback) ? _this.interpreter.require(s.feedback) : s.feedback\n      });\n    });\n  };\n\n  this.registerTokenizer = function (tokenizer) {\n    var overwrite = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;\n\n    if (!tokenizer || !tokenizer.id || !tokenizer.tokenize || !_lodash2.default.isFunction(tokenizer.tokenize)) throw new Error('invalid tokenizer ' + (tokenizer && tokenizer.id) + ': missing or invalid attribute id or fn');\n    if (overwrite === false && _this.messageTokenizers[tokenizer.id.toString()]) {\n      throw new Error('tokenizer ' + tokenizer.id + ' already registered & overwrite attribute false');\n    }\n    _this.messageTokenizers[tokenizer.id] = tokenizer.tokenize;\n  };\n\n  this.registerTokenizers = function (tokenizers) {\n    tokenizers.forEach(_this.registerTokenizer);\n  };\n\n  this.runTokenizers = function () {\n    var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(message, tokenizers) {\n      var promises;\n      return regeneratorRuntime.wrap(function _callee$(_context) {\n        while (1) {\n          switch (_context.prev = _context.next) {\n            case 0:\n              promises = tokenizers.map(function (tokenizer) {\n                return Promise.resolve(tokenizer.tokenize(message));\n              } // TODO: place catch to identify tokenizer error\n              );\n\n              // each value must be an object or it should be ignored\n              // should reduce to a single object merging properties\n              //                                values.reduce((a, b) => _.merge(a, b), {}) ///pode funcionar assim também\n\n              return _context.abrupt('return', Promise.all(promises).then(function (values) {\n                return Object.assign.apply(Object, _toConsumableArray(values));\n              }));\n\n            case 2:\n            case 'end':\n              return _context.stop();\n          }\n        }\n      }, _callee, _this);\n    }));\n\n    return function (_x5, _x6) {\n      return _ref2.apply(this, arguments);\n    };\n  }();\n\n  this.getTokenizer = function (tokenizerId) {\n    var tokenizer = _this.messageTokenizers[tokenizerId];\n    if (!tokenizer) throw new Error('Tokenizer ' + tokenizerId + ' not registered.');\n    return tokenizer;\n  };\n\n  this.getTokenizers = function (tokenizersIds) {\n    if (!tokenizersIds) return [];\n    return tokenizersIds.map(_this.getTokenizer);\n  };\n\n  this.getTopicTokenizers = function (topic) {\n    var globalTokenizers = topic.useGlobalTokenizers === false ? [] : _this.getTokenizers(_this.src.bot.globalTokenizers);\n    var topicTokenizers = _this.getTokenizers(topic.tokenizers || []);\n    return [].concat(_toConsumableArray(globalTokenizers), _toConsumableArray(topicTokenizers));\n  };\n\n  this.enrichContext = function (context, tokens) {\n    var internalAttrs = _extends({}, context[INTERNAL_ATTR]);\n    return _extends({}, context, tokens, _defineProperty({}, INTERNAL_ATTR, internalAttrs));\n  };\n\n  this.getTopic = function (topicId) {\n    return (\n      // TODO: Verificar necessidade, já que src.topics vai ser um objeto indexado pelo id\n      _this.src.topics[topicId]\n    );\n  };\n\n  this.use = function (handler) {\n    var _handler$tokenizers = handler.tokenizers,\n        tokenizers = _handler$tokenizers === undefined ? [] : _handler$tokenizers;\n\n    _this.registerTokenizers(tokenizers);\n  };\n\n  this.getTopicInteractions = function (topic) {\n    // TODO: return topic rules\n  };\n\n  this.getInteractionCandidates = function (interactions, context) {\n    // TODO: retornar interacoes cuja regra de match retorne truthy\n  };\n\n  this.getTargetInteraction = function (interactions, context) {\n    // TODO retornar interacao que deve ser executada, levando em conta a prioridade cadastrada\n  };\n\n  this.getTopicTargetInteraction = function (topic, context) {\n    var topicInteractions = _this.getTopicInteractions(topic);\n    return _this.getTargetInteraction(topicInteractions, context);\n  };\n\n  this.resolve = function () {\n    var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(message, ctx) {\n      var topic, topicTokenizers, messageTokens, enrichedContext, targetItnteraction;\n      return regeneratorRuntime.wrap(function _callee2$(_context2) {\n        while (1) {\n          switch (_context2.prev = _context2.next) {\n            case 0:\n              // get topic from context\n              topic = _this.getTopic(ctx[INTERNAL_ATTR].topicId) || _this.src.bot.rootTopic;\n              topicTokenizers = _this.getTopicTokenizers(topic);\n              _context2.next = 4;\n              return _this.runTokenizers(message, topicTokenizers);\n\n            case 4:\n              messageTokens = _context2.sent;\n              enrichedContext = _this.enrichContext(ctx, messageTokens);\n              targetItnteraction = _this.getTargetInteraction(topic, enrichedContext);\n\n              // TODO: @@@@@@@@@@@@@@@@@@@@ CONTINUAR @@@@@@@@@@@@@@@@@@@@@@@@@@\n\n            case 7:\n            case 'end':\n              return _context2.stop();\n          }\n        }\n      }, _callee2, _this);\n    }));\n\n    return function (_x7, _x8) {\n      return _ref3.apply(this, arguments);\n    };\n  }();\n};\n\nexports.default = LinusDialogBase;\nmodule.exports = exports['default'];\n\n//# sourceURL=webpack://linus.%5Bname%5D/./src/LinusDialogBase.js?");

/***/ }),

/***/ "./src/utils/RTInterpreter.js":
/*!************************************!*\
  !*** ./src/utils/RTInterpreter.js ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar _extendError2 = __webpack_require__(/*! ./extendError */ \"./src/utils/extendError.js\");\n\nvar _extendError3 = _interopRequireDefault(_extendError2);\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }\n\nfunction _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError(\"Cannot call a class as a function\"); } }\n\nfunction _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError(\"this hasn't been initialised - super() hasn't been called\"); } return call && (typeof call === \"object\" || typeof call === \"function\") ? call : self; }\n\nfunction _inherits(subClass, superClass) { if (typeof superClass !== \"function\" && superClass !== null) { throw new TypeError(\"Super expression must either be null or a function, not \" + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }\n\nvar _ = __webpack_require__(/*! lodash */ \"lodash\");\nvar vm = __webpack_require__(/*! vm */ \"./node_modules/vm-browserify/index.js\");\n\nvar RTInterpreterError = function (_extendError) {\n  _inherits(RTInterpreterError, _extendError);\n\n  function RTInterpreterError() {\n    _classCallCheck(this, RTInterpreterError);\n\n    return _possibleConstructorReturn(this, (RTInterpreterError.__proto__ || Object.getPrototypeOf(RTInterpreterError)).apply(this, arguments));\n  }\n\n  return RTInterpreterError;\n}((0, _extendError3.default)());\n\n;\n\nvar RTInterpreter = function RTInterpreter() {\n  var sandboxScope = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};\n\n  var sandbox = vm.createContext(_.merge(sandboxScope, { module: { exports: null } }));\n  var me = {};\n\n  me.require = function (code) {\n    if (!(typeof code === 'string')) {\n      throw new RTInterpreterError('Cannot compile code ' + code + '. Only strings allowed');\n    }\n    sandbox.module.exports = null;\n    try {\n      vm.runInNewContext(code, sandbox);\n    } catch (e) {\n      // throw new RTInterpreterError('Error interpreting source code.', e);\n      throw new RTInterpreterError('Error interpreting source code.');\n    }\n    return sandbox.module.exports;\n  };\n  me.interpretAttributes = function (obj) {\n    for (var _len = arguments.length, attrs = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {\n      attrs[_key - 1] = arguments[_key];\n    }\n\n    attrs.forEach(function (attr) {\n      var attrVal = obj[attr];\n      if (!attrVal) return;\n      if (!(typeof attr === 'string')) {\n        throw new RTInterpreterError('Cannot compile attribute ' + attr + '. Only strings allowed');\n      }\n      var code = 'module.exports = ' + attrVal;\n      // eslint-disable-next-line no-param-reassign\n      obj[attr] = me.require(code);\n    });\n  };\n  return me;\n};\n\nmodule.exports = RTInterpreter;\n\n//# sourceURL=webpack://linus.%5Bname%5D/./src/utils/RTInterpreter.js?");

/***/ }),

/***/ "./src/utils/extendError.js":
/*!**********************************!*\
  !*** ./src/utils/extendError.js ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\n/**\n * Error subclassing is still not well supported on browsers and not well handled by babel v6 (It should be fixed on 7 version, maybe).\n * This is a approximation approach to that.\n * It can be used to test instanceOf parent classes on catch statements.\n * @param {Class} cls - Class to extend\n * @return {ExtendableBuiltin}\n */\nvar extendError = function extendError() {\n  var cls = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Error;\n\n  function ExtendableBuiltin(message) {\n    var superInstance = Error.call(this, message);\n    Object.defineProperty(this, 'name', {\n      configurable: true,\n      enumerable: false,\n      value: this.constructor.name,\n      writable: true\n    });\n    Object.defineProperty(this, 'message', {\n      configurable: true,\n      enumerable: false,\n      value: message,\n      writable: true\n    });\n    // eslint-disable-next-line no-prototype-builtins\n    if (Error.hasOwnProperty('captureStackTrace')) {\n      Error.captureStackTrace(this, this.constructor);\n      return;\n    }\n    Object.defineProperty(this, 'stack', {\n      configurable: true,\n      enumerable: false,\n      value: superInstance.stack,\n      writable: true\n    });\n  }\n  ExtendableBuiltin.prototype = Object.create(cls.prototype);\n  // Object.setPrototypeOf(ExtendableBuiltin, Error.prototype);\n  return ExtendableBuiltin;\n};\n\nmodule.exports = extendError;\n\n//# sourceURL=webpack://linus.%5Bname%5D/./src/utils/extendError.js?");

/***/ }),

/***/ "./src/utils/requiredParam.js":
/*!************************************!*\
  !*** ./src/utils/requiredParam.js ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nmodule.exports = function requiredParam(param) {\n  var requiredParamError = new Error('Required parameter, \"' + param + '\" is missing.');\n  // preserve original stack trace (remove requiredParam from it)\n  if (typeof Error.captureStackTrace === 'function') {\n    Error.captureStackTrace(requiredParamError, requiredParam);\n  }\n  throw requiredParamError;\n};\n\n//# sourceURL=webpack://linus.%5Bname%5D/./src/utils/requiredParam.js?");

/***/ }),

/***/ "lodash":
/*!*************************************************************************************!*\
  !*** external {"commonjs":"lodash","commonjs2":"lodash","amd":"lodash","root":"_"} ***!
  \*************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = __WEBPACK_EXTERNAL_MODULE_lodash__;\n\n//# sourceURL=webpack://linus.%5Bname%5D/external_%7B%22commonjs%22:%22lodash%22,%22commonjs2%22:%22lodash%22,%22amd%22:%22lodash%22,%22root%22:%22_%22%7D?");

/***/ })

/******/ });
});