/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/js/console.js":
/*!***************************!*\
  !*** ./src/js/console.js ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"adjust_input_element_height\": () => (/* binding */ adjust_input_element_height)\n/* harmony export */ });\n/* harmony import */ var _scanner__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./scanner */ \"./src/js/scanner.js\");\n/* harmony import */ var _parser__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./parser */ \"./src/js/parser.js\");\n/* harmony import */ var _index__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./index */ \"./src/js/index.js\");\n\n\n\n\n/**\n * handles user input from the console div\n */\nconst state = {};\nconst command_input_element = document.getElementById('command_input');\nconst command_history_element = document.getElementById('command_history');\ncommand_input_element.value = '';\nlet command_history = [''];\nlet command_history_index = 0;\n\nconst adjust_input_element_height = function () {\n    let num_lines = command_input_element.value.split(/\\n/).length;\n    command_input_element.setAttribute('style', 'height: ' + num_lines + 'em');\n    if (num_lines > 1) {\n        command_input_element.setAttribute('class', 'multiline');\n    } else {\n        command_input_element.setAttribute('class', 'single_line');\n    }\n}\n\ncommand_input_element.onkeyup = function handle_key_input(event) {\n    adjust_input_element_height();\n    if (event.key === 'ArrowUp') {\n        if (command_history_index > -1) {\n            command_input_element.value = command_history[command_history_index];\n            if (command_history_index > 0) {\n                command_history_index -= 1;\n            }\n        }\n    }\n    if (event.key === 'ArrowDown') {\n        if (command_history_index < command_history.length - 1) {\n            command_history_index += 1;\n            command_input_element.value = command_history[command_history_index];\n        } else {\n            command_input_element.value = '';\n        }\n    }\n    if (event.key === 'Enter') {\n        let commands = command_input_element.value;\n        command_input_element.value = '';\n        adjust_input_element_height();\n        let command_array = commands.split(/\\n/);\n        for (let i = 0; i < command_array.length; i++) {\n            let command = command_array[i];\n            if (command.length > 0) {\n                command_history_element.innerText += command + \"\\n\";\n                command_input_element.value = '';\n                command_history_index = command_history.length;\n                let tokens = (0,_scanner__WEBPACK_IMPORTED_MODULE_0__.scan)(command);\n                let statement = (0,_parser__WEBPACK_IMPORTED_MODULE_1__.parse)(tokens);\n                let result;\n                try {\n                    result = visit_expression(statement);\n                    if (result.description) {\n                        result = result.description;\n                    }\n                } catch (e) {\n                    result = e.message;\n                }\n                command_history_element.innerText += result + \"\\n\";\n                command_history.push(command);\n                command_history_element.scrollTo(0, command_history_element.scrollHeight);\n            }\n        }\n    }\n};\n\nlet visit_expression = function (expr) {\n    switch (expr.type) {\n        case 'declaration': {\n            let value = visit_expression(expr.initializer);\n            let existing_value = state[expr.var_name.value];\n            if (existing_value) {\n                if (existing_value.type === 'vector') {\n                    (0,_index__WEBPACK_IMPORTED_MODULE_2__.remove_vector)(existing_value.object); // remove from screen\n                }\n            }\n            value.binding = expr.var_name.value;\n            state[expr.var_name.value] = value;\n            let description = state[expr.var_name.value].description;\n            if (!description) {\n                description = state[expr.var_name.value]; //questionable. use toString instead of message?\n            }\n            return {description: expr.var_name.value + ':' + description};\n        }\n        case 'group':\n            return visit_expression(expr.expression);\n        case 'unary': {\n            let right_operand = visit_expression(expr.right);\n            if (expr.operator === _scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.MINUS) {\n                return -right_operand;\n            } else if (expr.operator === _scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.NOT) {\n                return !right_operand;\n            } else {\n                throw {message: 'illegal unary operator'};\n            }\n        }\n        case 'binary': {\n            let left = visit_expression(expr.left);\n            let right = visit_expression(expr.right);\n            switch (expr.operator) {\n                case _scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.MINUS:\n                    return left - right;\n                case _scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.PLUS:\n                    return addition(left, right);\n                case _scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.STAR:\n                    return multiplication(left, right);\n                case _scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.SLASH:\n                    return left / right;\n                case _scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.DOT:\n                    return method_call(left, expr.right);\n            }\n            throw {message: 'illegal binary operator'};\n        }\n        case 'identifier': {\n            if (state[expr.name]) {\n                return state[expr.name];\n            } else {\n                break;\n            }\n        }\n        case 'literal':\n            return expr.value;\n        case 'call':\n            return call(expr.name, expr.arguments);\n        case 'lazy':\n            console.log(expr.value);\n            return visit_expression(expr.value);\n    }\n}\n\nconst call = function (function_name, argument_exprs) {\n    let arguments_list = [];\n    for (let i = 0; i < argument_exprs.length; i++) {\n        arguments_list.push(visit_expression(argument_exprs[i]));\n    }\n    if (functions[function_name]) {\n        return functions[function_name](arguments_list);\n    } else {\n        let arg_list = '';\n        for (let i = 0; i < argument_exprs.length; i++) {\n            if (i > 0) {\n                arg_list += ',';\n            }\n            arg_list += argument_exprs[i].value_type;\n        }\n        return 'unimplemented: ' + function_name + '(' + arg_list + ')';\n    }\n}\n\nconst method_call = function (object_wrapper, method_or_property) {\n    if (object_wrapper) {\n        if (method_or_property.type === 'call') { // method\n            if (typeof object_wrapper.object[method_or_property.name] !== 'function') {\n                throw {message: `method ${method_or_property.name} not found on ${object_wrapper.type}`};\n            }\n            return object_wrapper.object[method_or_property.name].apply(object_wrapper, method_or_property.arguments);\n\n        } else { // property\n            if (!Object.prototype.hasOwnProperty.call(object_wrapper.object, method_or_property.name)) {\n                throw {message: `property ${method_or_property.name} not found on ${object_wrapper.type}`};\n            }\n            return object_wrapper.object[method_or_property.name];\n        }\n    } else {\n        throw {message: `not found: ${object_wrapper}`};\n    }\n}\n\nconst functions = {\n    help: () => help(),\n    vector: (args) => (0,_index__WEBPACK_IMPORTED_MODULE_2__.add_vector)({x0: args[0], y0: args[1], x: args[2], y: args[3]}),\n    remove: (args) => {\n        if (Object.prototype.hasOwnProperty.call(args[0],'binding')){\n            delete state[args[0].binding];\n            return (0,_index__WEBPACK_IMPORTED_MODULE_2__.remove_vector)(args[0].object); // by binding value\n        } else {\n            return (0,_index__WEBPACK_IMPORTED_MODULE_2__.remove_vector)(args[0]); // by index (@...)\n        }\n\n    },\n}\n\nconst help = function () {\n    return {\n        description:\n            `- vector(<x0>, <y0>, <x>, <y>): draws a vector from x0,y0 to x,y\n                     - remove(<identifier>|<ref>): removes an object, \n                        a ref is @n where n is the reference number asigned to the object`\n    }\n}\n\nconst multiplication = function (left, right) {\n    if (left.object && left.type === 'vector' && !right.object) {\n        return left.object.multiply(right);\n    }\n    if (right.object && right.type === 'vector' && !left.object) {\n        return right.object.multiply(left);\n    }\n    return left * right;\n}\n\nconst addition = function (left, right) {\n    if (left.object && left.type === 'vector' && right.object && right.type === 'vector') {\n        return left.object.add(right.object);\n    }\n    return left + right;\n}\n\n\n//# sourceURL=webpack://matrepl/./src/js/console.js?");

/***/ }),

/***/ "./src/js/index.js":
/*!*************************!*\
  !*** ./src/js/index.js ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"add_vector\": () => (/* binding */ add_vector),\n/* harmony export */   \"remove_vector\": () => (/* binding */ remove_vector)\n/* harmony export */ });\n/* harmony import */ var _console_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./console.js */ \"./src/js/console.js\");\n/* harmony import */ var _scanner_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./scanner.js */ \"./src/js/scanner.js\");\n/* harmony import */ var _parser_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./parser.js */ \"./src/js/parser.js\");\n\n\n\n\nlet add_vector, remove_vector;\n\n/**\n * Main entry. draws the matrix\n */\nconst SVG_NS = 'http://www.w3.org/2000/svg'; // program needs these to create svg elements\nlet grid_size = 100; // this is the nr of pixels for the basis vector (1,0) (0,1)\nlet half_grid_size = grid_size >> 1; // used to position the grid lines\nlet vectors = []; // collection of added vectors\nlet moving_vector; // user can move vector arrows. when moving, this refers to the arrow\nlet width = window.innerWidth, height = window.innerHeight;\nlet origin_x = Math.floor((width / grid_size) / 2) * grid_size + half_grid_size,\n    origin_y = Math.floor((height / grid_size) / 2) * grid_size + half_grid_size;\n/**\n * Creates an svg element\n * @param element_type path,g, etc\n * @returns SVG element\n */\nconst create = function (element_type) {\n    return document.createElementNS(SVG_NS, element_type);\n}\n\n/**\n * creates the d attribute string\n * @param x0 start_x\n * @param y0 start_y\n * @param x1 end_x\n * @param y1 end y\n * @returns {string} to put in an SVG path\n */\nconst calculate_d = function (x0, y0, x1, y1) {\n    return \"M\" + x0 + \" \" + y0 + \" L\" + x1 + \" \" + y1;\n}\n\n/**\n * creates a SVG line (path)\n * @param x0 start_x\n * @param y0 start_y\n * @param x1 end_x\n * @param y1 end_y\n * @param css_class the css class to make up the element\n * @returns an SVG path element\n */\nconst create_line = function (x0, y0, x1, y1, css_class) {\n    let path = create('path');\n    path.setAttribute('d', calculate_d(x0, y0, x1, y1));\n    path.setAttribute('class', css_class);\n    return path;\n}\n\n/**\n * creates the arrow path element\n * @param id attribute\n * @param x0 start_x\n * @param y0 start_y\n * @param x1 end_x\n * @param y1 end_y\n * @param css_class class attribute\n * @returns {SVGPathElement}\n */\nconst arrow = function (id, x0, y0, x1, y1, css_class) {\n    let path = create('path');\n\n    path.setAttribute('d', calculate_d(x0, y0, x1, y1));\n    path.id = id;\n    path.setAttribute('class', css_class);\n    path.setAttribute('marker-end', 'url(#arrow)');\n    return path;\n}\n\n/**\n * Draws the background grid of the space\n * @param css_class class for the lines that are 'multiples of the basis vector'\n * @param bg_css_class class for in between lines\n * @returns {SVGGElement}\n */\nconst create_grid = function (css_class, bg_css_class) {\n    const group = create('g');\n    group.setAttribute('id', 'grid');\n    const horizontal = create('g');\n    horizontal.setAttribute('id', 'horizontal');\n    for (let y = 0; y < height; y += grid_size) {\n        horizontal.appendChild(create_line(0, y + half_grid_size, width, y + half_grid_size, css_class));\n        horizontal.appendChild(create_line(0, y, width, y, bg_css_class));\n    }\n    group.appendChild(horizontal);\n    const vertical = create('g');\n    vertical.setAttribute('id', 'vertical');\n    for (let x = 0; x < width; x += grid_size) {\n        vertical.appendChild(create_line(x + half_grid_size, 0, x + half_grid_size, height, css_class));\n        vertical.appendChild(create_line(x, 0, x, height, bg_css_class));\n    }\n    group.appendChild(vertical);\n    return group;\n}\n\n/**\n * removes child from element by id if found\n * @param element\n * @param child_id id to remove\n */\nconst remove_child = function (element, child_id) {\n    let node = element.firstChild;\n    while (node && child_id !== node.id) {\n        node = node.nextSibling;\n    }\n    if (node) {\n        element.removeChild(node);\n    }\n}\n\n/**\n * removes the grid from the DOM and adds an updated one.\n */\nconst redraw_grid = function () {\n    remove_child(svg, \"grid\");\n    svg.appendChild(create_grid('grid', 'bg-grid'));\n    svg.appendChild(create_axes());\n}\n\n/**\n * Adds a vector to the set.\n * @param vector\n */\nadd_vector = function (vector) {\n    vector.id = vectors.length;\n    vectors.push(vector);\n    redraw();\n    vector.add = (other) => add_vector({\n        x0: vector.x0 + other.x0,\n        y0: vector.x0 + other.x0,\n        x: vector.x + other.x,\n        y: vector.y + other.y\n    });\n    vector.multiply = (scalar) => add_vector({\n        x0: vector.x0 * scalar,\n        y0: vector.y0 * scalar,\n        x: vector.x * scalar,\n        y: vector.y * scalar\n    });\n    vector.is_vector = true;\n    vector.type = () => 'vector';\n    return { //object_wrapper\n        type: 'vector',\n        object: vector,\n        description: `vector@${vector.id}{x0:${vector.x0},y0:${vector.y0} x:${vector.x},y:${vector.y}}`,\n    };\n\n}\n\nremove_vector = function (vector_or_index) {\n    let index;\n    if (vector_or_index.is_vector) {\n        for (let i = 0; i < vectors.length; i++) {\n            if (vectors[i].id === vector_or_index.id) {\n                index = i;\n                break;\n            }\n        }\n    } else {\n        index = vector_or_index;\n    }\n\n    if (!vectors[index]) {\n        throw {message: `vector@${index} not found`};\n    }\n\n    vectors.splice(index, 1);\n    redraw();\n    return {description: `vector@${index} removed`};\n}\n\n/**\n * The moving operation. Called by onmousemove on the svg ('canvas')\n * @param event\n */\nconst move_vector = function (event) {\n    if (moving_vector) {\n        let current_x = event.clientX;\n        let current_y = event.clientY;\n        vectors[moving_vector.id].x = (current_x - origin_x) / grid_size;\n        vectors[moving_vector.id].y = (origin_y - current_y) / grid_size;\n        moving_vector.setAttribute('d', calculate_d(origin_x, origin_y, current_x, current_y));\n    }\n}\n\n/**\n * Draws all the vectors.\n *\n * vector {\n *     x0,y0 origin\n *     x,y coordinates\n * }\n */\nconst draw_vectors = function () {\n    const vector_group = create(\"g\");\n    vector_group.id = 'vectors';\n\n    for (let i = 0; i < vectors.length; i++) {\n        let vector_arrow = arrow(vectors[i].id,\n            origin_x + vectors[i].x0 * grid_size,\n            origin_y - vectors[i].y0 * grid_size,\n            origin_x + vectors[i].x * grid_size,\n            origin_y - vectors[i].y * grid_size,\n            'vector');\n        vector_arrow.onmousedown = function start_moving_vector(event) {\n            moving_vector = event.target;\n        };\n        vector_group.appendChild(vector_arrow);\n    }\n    svg.appendChild(vector_group);\n}\n\n/**\n * Removes all vectors in the svg and calls draw_vectors to draw updated versions.\n */\nconst redraw_vectors = function () {\n    remove_child(svg, 'vectors');\n    draw_vectors();\n}\n\n/**\n * (re)draws all\n */\nconst redraw = function () {\n    redraw_grid();\n    redraw_vectors();\n}\n\nconst create_axes = function () {\n    let axes_group = create('g');\n    let x = create_line(0, origin_y, width, origin_y, 'axis');\n    x.id = 'x-axis';\n    axes_group.appendChild(x);\n    let y = create_line(origin_x, 0, origin_x, height, 'axis');\n    y.id = 'y-axis';\n    axes_group.appendChild(y);\n    return axes_group;\n}\n\n/**\n * setup the arrow head for the vector\n * @returns {SVGDefsElement}\n */\nfunction create_defs() {\n    let defs = create('defs');\n    let marker = create('marker');\n    marker.id = 'arrow';\n    marker.setAttribute('orient', 'auto');\n    marker.setAttribute('viewBox', '0 0 10 10');\n    marker.setAttribute('markerWidth', '3');\n    marker.setAttribute('markerHeight', '4');\n    marker.setAttribute('markerUnits', 'strokeWidth');\n    marker.setAttribute('refX', '6');\n    marker.setAttribute('refY', '5');\n    let polyline = create('polyline');\n    polyline.setAttribute('points', '0,0 10,5 0,10 1,5');\n    polyline.setAttribute('fill', 'yellow');\n    marker.appendChild(polyline);\n    defs.appendChild(marker);\n    return defs;\n}\n\n/**\n * Creates the SVG\n * @returns {SVGElement}\n */\nconst create_svg = function () {\n    let svg = create('svg');\n\n    svg.onmousemove = move_vector();\n    svg.onmouseup = function stop_moving_vector() {\n        moving_vector = undefined;\n    };\n\n    let defs = create_defs();\n    svg.appendChild(defs);\n    return svg;\n}\n\ndocument.body.onresize = function recalculate_window_dimensions() {\n    width = window.innerWidth;\n    height = window.innerHeight;\n    origin_x = Math.floor((width / grid_size) / 2) * grid_size + half_grid_size;\n    origin_y = Math.floor((height / grid_size) / 2) * grid_size + half_grid_size;\n    redraw();\n}\n\nconst svg = create_svg();\ndocument.body.appendChild(svg);\n\nsvg.appendChild(create_grid('grid', 'bg-grid'));\nsvg.appendChild(create_axes());\n\n\n//# sourceURL=webpack://matrepl/./src/js/index.js?");

/***/ }),

/***/ "./src/js/parser.js":
/*!**************************!*\
  !*** ./src/js/parser.js ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"parse\": () => (/* binding */ parse)\n/* harmony export */ });\n/* harmony import */ var _scanner__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./scanner */ \"./src/js/scanner.js\");\n\n\n\nconst parse = function (tokens) {\n    let token_index = 0;\n\n    return statement();\n\n    function statement() {\n        if (check(_scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.IDENTIFIER, token_index) && check(_scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.EQUALS, token_index + 1)) {\n            let var_name = current_token();\n            advance();\n            advance();\n            return {type: 'declaration', var_name: var_name, initializer: expression()};\n        } else {\n            return expression();\n        }\n    }\n\n    function expression() {\n        return equality();\n    }\n\n    function equality() {\n        let expr = comparison()\n\n        while (match([_scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.EQUALS_EQUALS, _scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.NOT_EQUALS])) {\n            let operator = previous_token();\n            let right = unary();\n            expr = {type: 'binary', left: expr, operator: operator, right: right};\n        }\n\n        return expr;\n    }\n\n    function comparison() {\n        let expr = addition();\n\n        while (match([_scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.LESS, _scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.LESS_OR_EQUAL, _scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.GREATER, _scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.GREATER_OR_EQUAL])) {\n            let operator = previous_token();\n            let right = addition();\n            expr = {type: 'binary', left: expr, operator: operator, right: right};\n        }\n\n        return expr;\n    }\n\n    function addition() {\n        let expr = multiplication();\n\n        while (match([_scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.MINUS, _scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.PLUS])) {\n            let operator = previous_token();\n            let right = multiplication();\n            expr = {type: 'binary', left: expr, operator: operator, right: right};\n        }\n\n        return expr;\n    }\n\n    function multiplication() {\n        let expr = unary();\n\n        while (match([_scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.SLASH, _scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.STAR, _scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.DOT])) {\n            let operator = previous_token();\n            let right = unary();\n            expr = {type: 'binary', left: expr, operator: operator, right: right};\n        }\n\n        return expr;\n    }\n\n    function unary() {\n        if (match([_scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.NOT, _scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.MINUS])) {\n            let operator = previous_token();\n            let right = unary();\n            return {type: 'unary', operator: operator, right: right};\n        } else {\n            return call();\n        }\n    }\n\n    function call() {\n        let expr = primary();\n\n        for (;;){\n            if (match([_scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.LEFT_PAREN])) {\n                expr = finish_call(expr.name);\n            } else {\n                break;\n            }\n        }\n\n        return expr;\n    }\n\n    function finish_call(callee) {\n        let arguments_list = [];\n        if (!check(_scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.RIGHT_PAREN, token_index)) {\n            do {\n                arguments_list.push(expression());\n            } while (match([_scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.COMMA]));\n        }\n        if (!match([_scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.RIGHT_PAREN])) {\n            throw {message: \"Expect ')' after arguments.\"};\n        }\n\n        return {type: 'call', name: callee, arguments: arguments_list};\n    }\n\n\n    function primary() {\n        if (match([_scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.NUMERIC, _scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.STRING])) {\n            return {type: 'literal', value: previous_token().value, value_type: previous_token().type};\n        } else if (match([_scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.LAZY])) {\n            let tokens = (0,_scanner__WEBPACK_IMPORTED_MODULE_0__.scan)(previous_token().expression);\n            let expression = parse(tokens);\n            return {type: 'lazy', value: expression};\n        } else if (match([_scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.LEFT_PAREN])) {\n            let expr = expression();\n            if (expr && match([_scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.RIGHT_PAREN])) {\n                return {type: 'group', expression: expr};\n            } else {\n                throw {message: 'expected expression or )'};\n            }\n        } else if (check(_scanner__WEBPACK_IMPORTED_MODULE_0__.token_types.IDENTIFIER, token_index)) {\n            let identifier = {type: 'identifier', name: current_token().value};\n            advance();\n            return identifier;\n        }\n    }\n\n    /**\n     * matches token against array of tokens to check for equality (matching type)\n     * @param tokens_to_match array of tokens\n     * @returns {boolean}\n     */\n    function match(tokens_to_match) {\n        for (let i = 0; i < tokens_to_match.length; i++) {\n            if (are_same(tokens_to_match[i], current_token())) {\n                advance()\n                return true;\n            }\n        }\n        return false;\n    }\n\n    /**\n     * Checks if token at position index matches the given\n     * @param token_to_check expected token type\n     * @param index of token to check\n     * @returns {boolean}\n     */\n    function check(token_to_check, index) {\n        let token = tokens[index];\n        if (!token) {\n            return false;\n        }\n        return are_same(token_to_check, token);\n\n    }\n\n    /**\n     * checks if 2 tokens have same type\n     * @param token_1\n     * @param token_2\n     * @returns {boolean}\n     */\n    function are_same(token_1, token_2) {\n        if (is_at_end()) {\n            return false;\n        } else {\n            return token_1.type === token_2.type;\n        }\n\n    }\n\n    function is_at_end() {\n        return token_index >= tokens.length;\n    }\n\n    function advance() {\n        token_index += 1;\n    }\n\n    function previous_token() {\n        return tokens[token_index - 1];\n    }\n\n    function current_token() {\n        return tokens[token_index];\n    }\n}\n\n//# sourceURL=webpack://matrepl/./src/js/parser.js?");

/***/ }),

/***/ "./src/js/scanner.js":
/*!***************************!*\
  !*** ./src/js/scanner.js ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"scan\": () => (/* binding */ scan),\n/* harmony export */   \"token_types\": () => (/* binding */ token_types)\n/* harmony export */ });\n/**\n * Creates an array of tokens from a line of input.\n *\n * @param command: string\n * @returns {token_type[]}\n */\nconst scan = function (command) {\n    let current_index = 0, // current index of char to look at in the command string\n        word_start_index = 0, // marker for start of a literal or identifier\n        tokens = [];\n\n    while (!is_at_end()) {\n        word_start_index = current_index;\n        let token = scan_token();\n        if (token) { // undefined mostly means whitespace\n            tokens.push(token);\n        }\n    }\n    return tokens;\n\n    function scan_token() {\n        let next_char = advance();\n        switch (next_char) {\n            case '(':\n                return token_types.LEFT_PAREN;\n            case ')':\n                return token_types.RIGHT_PAREN;\n            case '[':\n                return token_types.LEFT_BRACKET;\n            case ']':\n                return token_types.RIGHT_BRACKET;\n            case ',':\n                return token_types.COMMA;\n            case '.':\n                return token_types.DOT;\n            case '-':\n                return token_types.MINUS;\n            case '+':\n                return token_types.PLUS;\n            case '*':\n                return token_types.STAR;\n            case '/':\n                return token_types.SLASH;\n            case '>':\n                if (expect('=')) {\n                    return token_types.GREATER_OR_EQUAL;\n                } else {\n                    return token_types.GREATER;\n                }\n            case '<':\n                if (expect('=')) {\n                    return token_types.LESS_OR_EQUAL;\n                } else {\n                    return token_types.LESS;\n                }\n            case '!':\n                if (expect('=')) {\n                    return token_types.NOT_EQUALS;\n                } else {\n                    return token_types.NOT;\n                }\n            case '=':\n                if (expect('=')) {\n                    return token_types.EQUALS_EQUALS;\n                } else {\n                    return token_types.EQUALS;\n                }\n            case '\\'':\n                return string();\n            case '\"':\n                return lazy_expression();\n        }\n        if (is_digit(next_char)) {\n            let token = Object.assign({}, token_types.NUMERIC);\n            token.value = parse_number();\n            return token;\n        } else {\n            if (is_alpha_or_underscore(next_char)) {\n                let token = Object.assign({}, token_types.IDENTIFIER);\n                token.value = parse_identifier();\n                return token;\n            }\n        }\n    }\n\n    function expect(expected_char) {\n        if (is_at_end()) {\n            return false;\n        }\n        if (current_char() === expected_char) {\n            advance();\n            return true;\n        } else {\n            return false;\n        }\n    }\n\n    function advance() {\n        if (current_index < command.length) {\n            current_index += 1;\n        }\n        return command[current_index - 1];\n    }\n\n    function is_at_end() {\n        return current_index >= command.length;\n    }\n\n    function current_char() {\n        return command[current_index];\n    }\n\n    function is_digit(char) {\n        return char >= '0' && char <= '9';\n    }\n\n    function is_part_of_number(char) {\n        return is_digit(char) || char === '.'; // no scientific notation for now\n    }\n\n    function parse_number() {\n        while (is_part_of_number(current_char())) {\n            advance();\n        }\n        let number_string = command.substring(word_start_index, current_index);\n        return Number.parseFloat(number_string);\n    }\n\n    function is_alpha_or_underscore(char) {\n        return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_';\n    }\n\n    function is_alphanumeric_or_underscore(char) {\n        return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || is_digit(char) || char === '_';\n    }\n\n    function parse_identifier() {\n        while (is_alphanumeric_or_underscore(current_char())) {\n            advance();\n        }\n        return command.substring(word_start_index, current_index);\n    }\n\n    function string() { // as of yet strings may not unclude escaped quotes that are also the start/end quote\n        while (current_char() !== '\\'' && !is_at_end()) {\n            advance();\n        }\n        if (is_at_end() && current_char() !== '\\'') {\n            throw {message: 'unterminated string'}\n        } else {\n            let string_token = Object.assign({}, token_types.STRING);\n            string_token.value = command.substring(word_start_index + 1, current_index);\n            advance();\n            return string_token;\n        }\n    }\n\n    function lazy_expression() {\n        while (current_char() !== '\"' && !is_at_end()) {\n            advance();\n        }\n        if (is_at_end() && current_char() !== '\"') {\n            throw {message: 'unterminated string'}\n        } else {\n            let lazy_token = Object.assign({}, token_types.LAZY);\n            lazy_token.expression = command.substring(word_start_index + 1, current_index);\n            advance();\n            return lazy_token;\n        }\n    }\n};\n\nconst token_types = {\n    LEFT_PAREN: {type: 'left_paren'},\n    RIGHT_PAREN: {type: 'right_paren'},\n    LEFT_BRACKET: {type: 'left_bracket'},\n    RIGHT_BRACKET: {type: 'right_bracket'},\n    COMMA: {type: 'comma'},\n    DOT: {type: 'dot'},\n    MINUS: {type: 'minus'},\n    PLUS: {type: 'plus'},\n    STAR: {type: 'star'},\n    SLASH: {type: 'slash'},\n    EQUALS: {type: 'equals'},\n    EQUALS_EQUALS: {type: 'equals_equals'},\n    NOT_EQUALS: {type: 'not_equals'},\n    NOT: {type: 'not'},\n    GREATER: {type: 'greater'},\n    GREATER_OR_EQUAL: {type: 'greater_or_equal'},\n    LESS: {type: 'less'},\n    LESS_OR_EQUAL: {type: 'less_or_equal'},\n    NUMERIC: {type: 'number', value: undefined},\n    IDENTIFIER: {type: 'identifier', value: undefined},\n    STRING: {type: 'string', value: undefined},\n    LAZY: {type: 'lazy', expression: undefined, parsed_expression:undefined}\n};\n\n\n//# sourceURL=webpack://matrepl/./src/js/scanner.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/js/index.js");
/******/ 	
/******/ })()
;